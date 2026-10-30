-- =====================================================
-- rod2buy — Identity verification: ID + selfie, admin review data
-- Run once in Supabase SQL Editor (after 009_shop_profiles.sql)
-- Safe to re-run.
--
-- 1. verification_requests: selfie holding the ID card, PDPA consent time,
--    what the admin checked, who reviewed
-- 2. New requests must include both photos (in the user's own folder) and
--    consent; one pending request per user
-- 3. admin_user_overview(): account facts + history for the review screen
-- =====================================================

-- ── 1. columns ────────────────────────────────────────
ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS selfie_path   text,
  ADD COLUMN IF NOT EXISTS consented_at  timestamptz,
  ADD COLUMN IF NOT EXISTS review_checks text[],
  ADD COLUMN IF NOT EXISTS reviewed_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── 2. what a user may submit ─────────────────────────
DROP POLICY IF EXISTS "owner_insert_verification" ON public.verification_requests;
CREATE POLICY "owner_insert_verification" ON public.verification_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND consented_at IS NOT NULL
    AND doc_path    LIKE auth.uid()::text || '/%'
    AND selfie_path LIKE auth.uid()::text || '/%'
    AND reason IS NULL AND review_checks IS NULL AND reviewed_by IS NULL AND reviewed_at IS NULL
  );

-- One open request per user (older duplicates, if any, keep the index from being created)
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS verification_requests_one_pending
    ON public.verification_requests (user_id) WHERE status = 'pending';
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'มีคำขอ pending ซ้ำของผู้ใช้เดียวกันอยู่ — ตรวจให้เหลือคนละ 1 แล้วรันไฟล์นี้อีกครั้ง';
END;
$$;

-- ── 3. admin review data ──────────────────────────────
-- Email / sign-in method live in auth.users and phone / LINE are hidden from
-- REST (migration 003), so the review screen reads them through this function.
CREATE OR REPLACE FUNCTION public.admin_user_overview(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'email',           u.email,
    'provider',        coalesce(u.raw_app_meta_data->>'provider', 'email'),
    'signed_up_at',    u.created_at,
    'last_sign_in_at', u.last_sign_in_at,
    'display_name',    p.display_name,
    'avatar_url',      p.avatar_url,
    'username',        p.username,
    'account_type',    p.account_type,
    'phone',           p.phone,
    'line_id',         p.line_id,
    'id_verified',     p.id_verified,
    'listings', (
      SELECT coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
      FROM (SELECT status, count(*) AS n FROM public.listings WHERE user_id = p_user_id GROUP BY status) s
    ),
    'reports_total', (
      SELECT count(*) FROM public.reports r
      JOIN public.listings l ON l.id = r.listing_id
      WHERE l.user_id = p_user_id
    ),
    'reports_open', (
      SELECT count(*) FROM public.reports r
      JOIN public.listings l ON l.id = r.listing_id
      WHERE l.user_id = p_user_id AND r.status = 'open'
    ),
    'past_requests', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('status', status, 'reason', reason, 'created_at', created_at)
                                ORDER BY created_at DESC), '[]'::jsonb)
      FROM public.verification_requests
      WHERE user_id = p_user_id AND status <> 'pending'
    )
  ) INTO v
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = p_user_id;

  RETURN v;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_user_overview(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_user_overview(uuid) TO authenticated;
