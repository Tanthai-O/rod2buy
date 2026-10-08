-- =====================================================
-- rod2buy — Security fixes + remaining roadmap features
-- Run once in Supabase SQL Editor (after 001_trust.sql)
-- Safe to re-run.
-- =====================================================

-- ── 0. helper: is current user admin? ────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── 1. profiles: users must not self-promote ─────────
-- Before this, owner_update_profile let any user set role='admin'
-- or id_verified=true on their own row.
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() is null for service role / SQL editor → allow everything
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role           := 'user';
    NEW.id_verified    := false;
    NEW.phone_verified := false;
    NEW.verified_at    := NULL;
  ELSE
    NEW.role           := OLD.role;
    NEW.id_verified    := OLD.id_verified;
    NEW.phone_verified := OLD.phone_verified;
    NEW.verified_at    := OLD.verified_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_columns ON public.profiles;
CREATE TRIGGER profiles_protect_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

-- Admin can update any profile (needed to grant id_verified)
DROP POLICY IF EXISTS "admin_update_profiles" ON public.profiles;
CREATE POLICY "admin_update_profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- PDPA: anonymous visitors must not be able to read phone / LINE via REST.
-- Logged-in users still can (matches the "login to see phone" UX).
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, display_name, avatar_url, id_verified, phone_verified, verified_at, created_at)
  ON public.profiles TO anon;

-- ── 2. listings: owners cannot approve themselves ────
CREATE OR REPLACE FUNCTION public.guard_listing_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status           := 'pending';
    NEW.rejection_reason := NULL;
    RETURN NEW;
  END IF;

  -- Owner may: resubmit (→ pending) or mark sold (active → sold)
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (NEW.status = 'pending')
     AND NOT (OLD.status = 'active' AND NEW.status = 'sold') THEN
    NEW.status := OLD.status;
  END IF;

  -- Owner may clear a rejection reason (on resubmit) but never write one
  IF NEW.rejection_reason IS NOT NULL
     AND NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
    NEW.rejection_reason := OLD.rejection_reason;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_guard_status ON public.listings;
CREATE TRIGGER listings_guard_status
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.guard_listing_status();

-- Admin can read every listing (moderation queue reads pending ones)
DROP POLICY IF EXISTS "admin_read_listings" ON public.listings;
CREATE POLICY "admin_read_listings" ON public.listings
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ── 3. car_events: owner can edit / delete ───────────
DROP POLICY IF EXISTS "owner_delete_car_events" ON public.car_events;
CREATE POLICY "owner_delete_car_events" ON public.car_events
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_id AND user_id = auth.uid()
    )
  );

-- ── 4. seller_reviews ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.seller_reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_reviews
  ADD COLUMN IF NOT EXISTS seller_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reviewer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS listing_id  uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rating      smallint CHECK (rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS comment     text CHECK (char_length(comment) <= 1000);

CREATE UNIQUE INDEX IF NOT EXISTS seller_reviews_one_per_pair
  ON public.seller_reviews (seller_id, reviewer_id);

ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_reviews" ON public.seller_reviews;
CREATE POLICY "public_read_reviews" ON public.seller_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviewer_insert_reviews" ON public.seller_reviews;
CREATE POLICY "reviewer_insert_reviews" ON public.seller_reviews
  FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid() AND seller_id <> auth.uid());

DROP POLICY IF EXISTS "reviewer_delete_reviews" ON public.seller_reviews;
CREATE POLICY "reviewer_delete_reviews" ON public.seller_reviews
  FOR DELETE TO authenticated
  USING (reviewer_id = auth.uid() OR public.is_admin());

-- ── 5. reports (แจ้งประกาศน่าสงสัย) ───────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS listing_id  uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reason      text,
  ADD COLUMN IF NOT EXISTS details     text CHECK (char_length(details) <= 1000),
  ADD COLUMN IF NOT EXISTS status      text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved', 'dismissed'));

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reporter_insert_reports" ON public.reports;
CREATE POLICY "reporter_insert_reports" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "admin_read_reports" ON public.reports;
CREATE POLICY "admin_read_reports" ON public.reports
  FOR SELECT TO authenticated
  USING (public.is_admin() OR reporter_id = auth.uid());

DROP POLICY IF EXISTS "admin_update_reports" ON public.reports;
CREATE POLICY "admin_update_reports" ON public.reports
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── 6. verification_requests (ID card review queue) ──
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_path    text NOT NULL,
  status      text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_insert_verification" ON public.verification_requests;
CREATE POLICY "owner_insert_verification" ON public.verification_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "owner_admin_read_verification" ON public.verification_requests;
CREATE POLICY "owner_admin_read_verification" ON public.verification_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "admin_update_verification" ON public.verification_requests;
CREATE POLICY "admin_update_verification" ON public.verification_requests
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── 7. saved_listings: remember price → price-drop badge ─
ALTER TABLE public.saved_listings
  ADD COLUMN IF NOT EXISTS price_at_save integer;

UPDATE public.saved_listings s
SET price_at_save = l.price
FROM public.listings l
WHERE l.id = s.listing_id AND s.price_at_save IS NULL;

CREATE OR REPLACE FUNCTION public.set_price_at_save()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT price INTO NEW.price_at_save FROM public.listings WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS saved_listings_price_at_save ON public.saved_listings;
CREATE TRIGGER saved_listings_price_at_save
  BEFORE INSERT ON public.saved_listings
  FOR EACH ROW EXECUTE FUNCTION public.set_price_at_save();

-- One save per user per listing (skip if old duplicates exist)
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS saved_listings_user_listing
    ON public.saved_listings (user_id, listing_id);
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'saved_listings has duplicates — unique index skipped';
END;
$$;

-- ── 8. views (source of truth for Price Estimator / Trust Score) ─
-- The old seller_scores exposed seller_id, but the app queries user_id.
-- Drop whatever form these currently have (view or materialized view).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'price_estimates') THEN
    DROP MATERIALIZED VIEW public.price_estimates;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'seller_scores') THEN
    DROP MATERIALIZED VIEW public.seller_scores;
  END IF;
END;
$$;

DROP VIEW IF EXISTS public.price_estimates;
CREATE VIEW public.price_estimates AS
SELECT
  brand,
  model,
  year,
  round(avg(price))::integer AS avg_price,
  min(price)::integer        AS min_price,
  max(price)::integer        AS max_price,
  count(*)::integer          AS sample_count
FROM public.listings
WHERE status IN ('active', 'sold')
GROUP BY brand, model, year;

DROP VIEW IF EXISTS public.seller_scores;
CREATE VIEW public.seller_scores AS
SELECT
  p.id AS user_id,
  (SELECT round(avg(r.rating)::numeric, 2)::float8
     FROM public.seller_reviews r WHERE r.seller_id = p.id)          AS avg_rating,
  (SELECT count(*)::integer
     FROM public.seller_reviews r WHERE r.seller_id = p.id)          AS review_count,
  (SELECT count(*)::integer
     FROM public.listings l
     WHERE l.user_id = p.id AND l.status IN ('active', 'sold'))      AS total_listings,
  (SELECT count(*)::integer
     FROM public.listings l
     WHERE l.user_id = p.id AND l.status = 'sold')                   AS sold_count,
  NULL::float8                                                       AS response_rate
FROM public.profiles p;

GRANT SELECT ON public.price_estimates TO anon, authenticated;
GRANT SELECT ON public.seller_scores   TO anon, authenticated;
