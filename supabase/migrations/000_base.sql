-- =====================================================
-- rod2buy — Base schema (ตารางตั้งต้นก่อน 001_trust.sql)
--
-- ตารางพวกนี้เดิมสร้างใน Supabase dashboard และไม่เคยมีไฟล์ใน repo
-- (supabase/schema.sql เดิมเสีย) ไฟล์นี้สร้างขึ้นใหม่จาก migrations 001–014,
-- seed และโค้ดในแอป — สร้าง DB ใหม่: รันไฟล์นี้ก่อน แล้วตามด้วย 001 → 014
--
-- มีเฉพาะสิ่งที่ migration หลังจากนี้ต้องมีอยู่แล้ว: คอลัมน์ที่ 001+ เพิ่มเอง
-- (role, id_verified, rejection_reason, …) ไม่อยู่ที่นี่
--
-- ⚠ ห้ามรันบน DB production ที่มีตารางอยู่แล้ว — ใช้สร้าง DB ใหม่เท่านั้น
--   (CREATE TABLE IF NOT EXISTS ไม่แก้ตารางเดิม แต่ policy ด้านล่างจะถูกสร้างทับ)
-- ทดสอบทั้งชุดได้ด้วย scripts/db-check/run.sh
-- =====================================================

-- ── profiles (1 แถวต่อ auth.users — แอปสร้างตอน /auth/callback) ──
CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url   text,
  phone        text,
  line_id      text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── listings ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.listings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text NOT NULL,
  brand        text NOT NULL,
  model        text NOT NULL,
  year         integer NOT NULL,
  price        integer NOT NULL CHECK (price >= 0),
  mileage      integer NOT NULL DEFAULT 0 CHECK (mileage >= 0),
  province     text NOT NULL,
  fuel_type    text NOT NULL
    CHECK (fuel_type IN ('petrol', 'diesel', 'hybrid', 'electric', 'ngv')),
  transmission text NOT NULL CHECK (transmission IN ('auto', 'manual')),
  color        text,
  description  text,
  images       jsonb NOT NULL DEFAULT '[]'::jsonb,  -- array ของ URL (014 อ่านเป็น jsonb)
  status       text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'sold')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listings_user_id_idx ON public.listings (user_id);

-- ── car_events (Car History Card) ────────────────────
CREATE TABLE IF NOT EXISTS public.car_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  event_date  date NOT NULL,
  event_type  text NOT NULL,
  description text,
  mileage_at  integer,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS car_events_listing_idx ON public.car_events (listing_id, event_date);

-- ── saved_listings (wishlist / swipe ขวา) ─────────────
-- unique (user_id, listing_id) + price_at_save เพิ่มใน 002
CREATE TABLE IF NOT EXISTS public.saved_listings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── response_logs (คนกดดูเบอร์ผู้ขาย — เขียนผ่าน reveal_contact() ใน 003) ─
CREATE TABLE IF NOT EXISTS public.response_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  listing_id   uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  contacted_at timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ──────────────────────────────────────────────
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_logs  ENABLE ROW LEVEL SECURITY;

-- profiles: ทุกคนอ่านได้ (002/003 จำกัดคอลัมน์ด้วย GRANT), เจ้าของสร้าง/แก้แถวตัวเอง
DROP POLICY IF EXISTS "public_read_profiles" ON public.profiles;
CREATE POLICY "public_read_profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "owner_insert_profile" ON public.profiles;
CREATE POLICY "owner_insert_profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "owner_update_profile" ON public.profiles;
CREATE POLICY "owner_update_profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- listings: เดิมอยู่ใน supabase/rls_listings.sql (ลบแล้ว — ย้ายมาที่นี่)
-- (policy ฝั่ง admin สร้างใน 002/003/006 เพราะต้องใช้ is_admin())
DROP POLICY IF EXISTS "public_read_active_listings" ON public.listings;
CREATE POLICY "public_read_active_listings" ON public.listings
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "owner_read_own_listings" ON public.listings;
CREATE POLICY "owner_read_own_listings" ON public.listings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_insert_listings" ON public.listings;
CREATE POLICY "owner_insert_listings" ON public.listings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_update_listings" ON public.listings;
CREATE POLICY "owner_update_listings" ON public.listings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owner_delete_listings" ON public.listings;
CREATE POLICY "owner_delete_listings" ON public.listings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- car_events: ทุกคนอ่านได้, เจ้าของประกาศเพิ่มได้ (ลบได้ — 002)
DROP POLICY IF EXISTS "public_read_car_events" ON public.car_events;
CREATE POLICY "public_read_car_events" ON public.car_events
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "owner_insert_car_events" ON public.car_events;
CREATE POLICY "owner_insert_car_events" ON public.car_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings
      WHERE id = listing_id AND user_id = auth.uid()
    )
  );

-- saved_listings: เจ้าของจัดการของตัวเอง
DROP POLICY IF EXISTS "owner_manage_saved_listings" ON public.saved_listings;
CREATE POLICY "owner_manage_saved_listings" ON public.saved_listings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- response_logs: policy อ่านอยู่ใน 003, ไม่มี INSERT policy (เขียนผ่าน RPC เท่านั้น)

-- ── Storage: car-images (public) ─────────────────────
-- path: {user_id}/{listing_id}/… และรูปปกร้าน {user_id}/profile/…
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'car-images',
  'car-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_car_images" ON storage.objects;
CREATE POLICY "public_read_car_images" ON storage.objects
  FOR SELECT USING (bucket_id = 'car-images');

DROP POLICY IF EXISTS "owner_upload_car_images" ON storage.objects;
CREATE POLICY "owner_upload_car_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'car-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "owner_update_car_images" ON storage.objects;
CREATE POLICY "owner_update_car_images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'car-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "owner_delete_car_images" ON storage.objects;
CREATE POLICY "owner_delete_car_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'car-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
