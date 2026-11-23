-- smoke test RLS บนตารางจาก 000_base.sql — รันหลัง migrations + seed (ดู run.sh)
-- ผู้ขายทดสอบ 5eed…0001, ผู้ซื้อทดสอบ 5eed…0002 (จาก seed)
-- ทุกบล็อก ROLLBACK ไม่ทิ้งข้อมูลไว้

-- ── anon: เห็นเฉพาะประกาศ active, อ่านเบอร์ไม่ได้ ──
BEGIN;
SET LOCAL ROLE anon;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.listings WHERE status <> 'active') THEN
    RAISE EXCEPTION 'anon เห็นประกาศที่ไม่ active';
  END IF;
  IF (SELECT count(*) FROM public.listings) = 0 THEN
    RAISE EXCEPTION 'anon ไม่เห็นประกาศเลย';
  END IF;
  IF (SELECT count(*) FROM public.car_events) = 0 THEN
    RAISE EXCEPTION 'anon อ่าน car_events ไม่ได้';
  END IF;
  BEGIN
    PERFORM phone FROM public.profiles LIMIT 1;
    RAISE EXCEPTION 'anon อ่าน profiles.phone ได้';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
ROLLBACK;

-- ── ผู้ขาย: ลงประกาศได้ แต่ขึ้น pending เสมอ, รูปต้องอยู่ในโฟลเดอร์ตัวเอง ──
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '5eed0000-0000-4000-8000-000000000001', true);
DO $$
DECLARE v_id uuid; v_status text;
BEGIN
  INSERT INTO public.listings (user_id, title, brand, model, year, price, mileage, province, fuel_type, transmission, status, images)
  VALUES (auth.uid(), 'smoke', 'Toyota', 'Yaris', 2020, 400000, 50000, 'กรุงเทพมหานคร', 'petrol', 'auto', 'active', '[]')
  RETURNING id, status INTO v_id, v_status;
  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'ผู้ขาย approve ประกาศตัวเองได้ (status=%)', v_status;
  END IF;

  INSERT INTO public.car_events (listing_id, event_date, event_type) VALUES (v_id, current_date, 'service');

  BEGIN
    UPDATE public.listings SET images = '["https://evil.example/x.jpg"]' WHERE id = v_id;
    RAISE EXCEPTION 'ใส่ URL รูปภายนอกได้';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO public.listings (user_id, title, brand, model, year, price, mileage, province, fuel_type, transmission)
    VALUES ('5eed0000-0000-4000-8000-000000000002', 'x', 'Toyota', 'Yaris', 2020, 1, 0, 'x', 'petrol', 'auto');
    RAISE EXCEPTION 'ลงประกาศในชื่อคนอื่นได้';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
ROLLBACK;

-- ── ผู้ซื้อ: แก้ประกาศคนอื่นไม่ได้, บันทึกรถได้, ดูเบอร์ผ่าน RPC ได้ ──
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '5eed0000-0000-4000-8000-000000000002', true);
DO $$
DECLARE v_listing uuid; v_n int; v_phone text;
BEGIN
  SELECT id INTO v_listing FROM public.listings
  WHERE status = 'active' AND user_id = '5eed0000-0000-4000-8000-000000000001' LIMIT 1;

  UPDATE public.listings SET price = 1 WHERE id = v_listing;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 0 THEN RAISE EXCEPTION 'ผู้ซื้อแก้ประกาศคนอื่นได้'; END IF;

  BEGIN
    INSERT INTO public.car_events (listing_id, event_date, event_type) VALUES (v_listing, current_date, 'x');
    RAISE EXCEPTION 'เพิ่ม car_events ให้ประกาศคนอื่นได้';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  INSERT INTO public.saved_listings (user_id, listing_id) VALUES (auth.uid(), v_listing);
  IF (SELECT price_at_save FROM public.saved_listings WHERE listing_id = v_listing AND user_id = auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'price_at_save ไม่ถูกตั้ง';
  END IF;

  SELECT phone INTO v_phone FROM public.reveal_contact(v_listing);
  IF v_phone IS NULL THEN RAISE EXCEPTION 'reveal_contact ไม่คืนเบอร์'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.response_logs WHERE buyer_id = auth.uid()) THEN
    RAISE EXCEPTION 'reveal_contact ไม่บันทึก response_logs';
  END IF;
END $$;
ROLLBACK;

-- ── ผู้ใช้ใหม่: สร้าง profile ตัวเองได้ (แบบ /auth/callback) แต่ตั้งตัวเองเป็น admin ไม่ได้ ──
BEGIN;
INSERT INTO auth.users (id, email, aud, role)
VALUES ('00000000-0000-4000-8000-00000000000e', 'new@db-check.test', 'authenticated', 'authenticated');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000000e', true);
DO $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url) VALUES (auth.uid(), 'ใหม่', NULL)
  ON CONFLICT (id) DO NOTHING;
  UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid();
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) <> 'user' THEN
    RAISE EXCEPTION 'ผู้ใช้ตั้งตัวเองเป็น admin ได้';
  END IF;
END $$;
ROLLBACK;
