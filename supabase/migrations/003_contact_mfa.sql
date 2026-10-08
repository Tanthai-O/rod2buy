-- =====================================================
-- rod2buy — contact privacy, verified reviews, admin 2FA
-- Run once in Supabase SQL Editor (after 002_features.sql)
-- Safe to re-run.
--
-- ⚠️ After this migration, admin powers require 2FA (TOTP).
--    Admins: set it up at /account/security, then sign in again.
-- =====================================================

-- ── 1. response_logs: one row per buyer who revealed a seller's contact ─
ALTER TABLE public.response_logs
  ALTER COLUMN contacted_at SET DEFAULT now();

DO $$
BEGIN
  -- make sure inserts without an explicit id work
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'response_logs'
      AND column_name = 'id' AND data_type = 'uuid' AND column_default IS NULL
  ) THEN
    ALTER TABLE public.response_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS response_logs_buyer_time
  ON public.response_logs (buyer_id, contacted_at DESC);

ALTER TABLE public.response_logs ENABLE ROW LEVEL SECURITY;

-- Buyers see their own contacts, sellers see who contacted them.
-- No INSERT policy: rows are written only by reveal_contact() below.
DROP POLICY IF EXISTS "party_read_response_logs" ON public.response_logs;
CREATE POLICY "party_read_response_logs" ON public.response_logs
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- ── 2. phone / LINE: nobody reads them directly anymore ─
-- Before: any logged-in account could scrape every seller's phone via REST.
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, display_name, avatar_url, id_verified, phone_verified, verified_at, role, created_at)
  ON public.profiles TO authenticated;

-- Reveal a seller's contact for a listing: logs the contact and rate-limits
-- each buyer to 20 new sellers' contacts per 24h.
CREATE OR REPLACE FUNCTION public.reveal_contact(p_listing_id uuid)
RETURNS TABLE (phone text, line_id text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid    uuid := auth.uid();
  v_seller uuid;
  v_status text;
  v_recent integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'login_required';
  END IF;

  SELECT l.user_id, l.status INTO v_seller, v_status
  FROM public.listings l WHERE l.id = p_listing_id;

  IF v_seller IS NULL OR (v_status <> 'active' AND v_seller <> v_uid AND NOT public.is_admin()) THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  IF v_seller <> v_uid AND NOT EXISTS (
    SELECT 1 FROM public.response_logs
    WHERE buyer_id = v_uid AND listing_id = p_listing_id
  ) THEN
    SELECT count(*) INTO v_recent
    FROM public.response_logs
    WHERE buyer_id = v_uid AND contacted_at > now() - interval '24 hours';

    IF v_recent >= 20 THEN
      RAISE EXCEPTION 'rate_limited';
    END IF;

    INSERT INTO public.response_logs (seller_id, listing_id, buyer_id, contacted_at)
    VALUES (v_seller, p_listing_id, v_uid, now());
  END IF;

  RETURN QUERY
  SELECT p.phone::text, p.line_id::text FROM public.profiles p WHERE p.id = v_seller;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reveal_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reveal_contact(uuid) TO authenticated;

-- The signed-in user's own contact details (dashboard)
CREATE OR REPLACE FUNCTION public.my_contact()
RETURNS TABLE (phone text, line_id text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.phone::text, p.line_id::text FROM public.profiles p WHERE p.id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.my_contact() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_contact() TO authenticated;

-- ── 3. reviews only from people who actually contacted the seller ─
DROP POLICY IF EXISTS "reviewer_insert_reviews" ON public.seller_reviews;
CREATE POLICY "reviewer_insert_reviews" ON public.seller_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND seller_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.response_logs r
      WHERE r.buyer_id = auth.uid() AND r.seller_id = seller_reviews.seller_id
    )
  );

-- ── 4. admin powers require 2FA (aal2) ───────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
     AND EXISTS (
       SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
     );
$$;

-- Older policies (001 / rls_listings.sql) checked the role inline; route them through is_admin()
DROP POLICY IF EXISTS "admin_update_listings" ON public.listings;
CREATE POLICY "admin_update_listings" ON public.listings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_read_audit_logs" ON public.audit_logs;
CREATE POLICY "admin_read_audit_logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "owner_admin_read_verification_docs" ON storage.objects;
CREATE POLICY "owner_admin_read_verification_docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

-- PDPA data minimisation: admins delete ID card photos once reviewed
DROP POLICY IF EXISTS "admin_delete_verification_docs" ON storage.objects;
CREATE POLICY "admin_delete_verification_docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'verification-docs' AND public.is_admin());

ALTER TABLE public.verification_requests
  ALTER COLUMN doc_path DROP NOT NULL;
