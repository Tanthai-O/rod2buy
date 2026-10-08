-- =====================================================
-- RLS policies for listings table
-- Run in Supabase SQL Editor
-- Safe to run multiple times (DROP IF EXISTS first)
-- =====================================================

-- Anyone can read active listings (browse page)
DROP POLICY IF EXISTS "public_read_active_listings"  ON public.listings;
CREATE POLICY "public_read_active_listings" ON public.listings
  FOR SELECT
  USING (status = 'active');

-- Owner can read all their own listings (pending / active / sold)
DROP POLICY IF EXISTS "owner_read_own_listings" ON public.listings;
CREATE POLICY "owner_read_own_listings" ON public.listings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can insert their own listing
DROP POLICY IF EXISTS "owner_insert_listings" ON public.listings;
CREATE POLICY "owner_insert_listings" ON public.listings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Owner can update their own listing
DROP POLICY IF EXISTS "owner_update_listings" ON public.listings;
CREATE POLICY "owner_update_listings" ON public.listings
  FOR UPDATE TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owner can delete their own listing
DROP POLICY IF EXISTS "owner_delete_listings" ON public.listings;
CREATE POLICY "owner_delete_listings" ON public.listings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Admin can approve / reject (update any listing)
DROP POLICY IF EXISTS "admin_update_listings" ON public.listings;
CREATE POLICY "admin_update_listings" ON public.listings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- Also fix car_events, saved_listings, reports
-- =====================================================

-- car_events: owner of the listing can insert events
DROP POLICY IF EXISTS "owner_insert_car_events" ON public.car_events;
CREATE POLICY "owner_insert_car_events" ON public.car_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "public_read_car_events" ON public.car_events;
CREATE POLICY "public_read_car_events" ON public.car_events
  FOR SELECT USING (true);

-- saved_listings: owner manages their own saves
DROP POLICY IF EXISTS "owner_manage_saved_listings" ON public.saved_listings;
CREATE POLICY "owner_manage_saved_listings" ON public.saved_listings
  FOR ALL TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- profiles: anyone can read, owner can update their own
DROP POLICY IF EXISTS "public_read_profiles" ON public.profiles;
CREATE POLICY "public_read_profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "owner_update_profile" ON public.profiles;
CREATE POLICY "owner_update_profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
