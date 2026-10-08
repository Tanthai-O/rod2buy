-- =====================================================
-- rod2buy — Fix "permission denied for table profiles" on /listings
-- Run once in Supabase SQL Editor (after 005_listing_specs.sql)
-- Safe to re-run.
--
-- A legacy policy "View listings" (created in the dashboard, not in any
-- migration) checked admin access by reading profiles.role directly.
-- Since 002 revoked anon's SELECT on profiles.role, every logged-out
-- visitor got "permission denied" when browsing listings.
-- Replace it with the split policies below; admin checks go through
-- is_admin() (SECURITY DEFINER), which can read profiles safely.
-- =====================================================

DROP POLICY IF EXISTS "View listings" ON public.listings;

DROP POLICY IF EXISTS "public_read_active_listings" ON public.listings;
CREATE POLICY "public_read_active_listings" ON public.listings
  FOR SELECT
  USING (status = 'active');

DROP POLICY IF EXISTS "owner_read_own_listings" ON public.listings;
CREATE POLICY "owner_read_own_listings" ON public.listings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_read_listings" ON public.listings;
CREATE POLICY "admin_read_listings" ON public.listings
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Check afterwards: this should return no rows. Any policy listed here reads
-- profiles directly and may break for anon — switch it to public.is_admin().
--
--   SELECT tablename, policyname, qual, with_check FROM pg_policies
--   WHERE schemaname = 'public'
--     AND (qual ILIKE '%profiles%' OR with_check ILIKE '%profiles%');
