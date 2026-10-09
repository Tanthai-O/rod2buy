-- ============================================================
-- rod2buy — Seed Data (ข้อมูลตัวอย่าง 20 คัน — แต่งขึ้นเอง ไม่ได้คัดลอกจากเว็บอื่น)
-- รันหลัง migrations ครบ (001–007)
-- ประกาศทั้งหมดผูกกับบัญชี admin คนแรก (ต้องมี admin อย่างน้อย 1 คน)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'ต้องมีบัญชี admin อย่างน้อย 1 คนก่อนรัน seed (UPDATE profiles SET role = ''admin'' WHERE id = ''<your-user-id>'')';
  END IF;
END;
$$;

INSERT INTO public.listings
  (brand, model, year, price, province, fuel_type, mileage, images, status, transmission, color, description,
   variant, body_type, cab_type, engine_cc, drivetrain, seats, seller_type, title, user_id)
VALUES
  (
    'Toyota', 'Camry', 2022, 1199000,
    'กรุงเทพมหานคร', 'hybrid', 28000, '[]', 'active', 'auto',
    'สีเทาดาวเคราะห์',
    'Camry Hybrid 2.5V ปี 22 มือเดียว ออกห้าง ประวัติศูนย์ครบ เอกสารพร้อม',
    '2.5 HEV Premium', 'sedan', NULL, 2487, '2wd', 5, 'private',
    'Toyota Camry 2.5 HEV Premium 2022', (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  ),
  (
    'Honda', 'Civic', 2021, 749000,
    'กรุงเทพมหานคร', 'petrol', 42000, '[]', 'active', 'auto',
    'สีขาวแพลทินัม',
    'Civic RS 1.5 Turbo ปี 21 แต่งสวย ช่วงล่างดี ใช้งานดูแลดี',
    '1.5 Turbo RS', 'sedan', NULL, 1498, '2wd', 5, 'private',
    'Honda Civic 1.5 Turbo RS 2021', (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  ),
  (
    'Isuzu', 'D-Max', 2022, 645000,
    'ขอนแก่น', 'diesel', 55000, '[]', 'active', 'manual',
    'สีขาว',
    'D-Max Spacecab Hi-Lander ปี 22 ดีเซล 1.9 ใช้งานในจังหวัด สภาพดี',
    'Spacecab Hi-Lander 1.9', 'pickup', 'extended', 1898, '2wd', 2, 'private',
    'Isuzu D-Max Spacecab Hi-Lander 1.9 2022', (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  ),
  (
    'Toyota', 'Fortuner', 2021, 1099000,
    'เชียงใหม่', 'diesel', 38000, '[]', 'active', 'auto',
    'สีดำ',
    'Fortuner 2.8 Legender 4WD ปี 21 ออฟชันเต็ม ราคาต่อรองได้',
    '2.8 Legender 4WD', 'ppv', NULL, 2755, '4wd', 7, 'dealer',
    'Toyota Fortuner 2.8 Legender 4WD 2021', (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  ),
  (
    'Honda', 'HR-V', 2022, 819000,
    'ชลบุรี', 'petrol', 22000, '[]', 'active', 'auto',
    'สีแดงเลือดนก',
    'HR-V e:HEV RS ปี 22 ไม่เคยชน เช็คศูนย์ตลอด พร้อมใช้',
    'e:HEV RS', 'suv', NULL, 1498, '2wd', 5, 'private',
    'Honda HR-V e:HEV RS 2022', (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  ),
  (
    'Toyota', 'Yaris Ativ', 2023, 469000,
    'นนทบุรี', 'petrol', 15000, '[]', 'active', 'auto',
    'สีขาวมุก',
    'Yaris Ativ Sport ปี 23 ยังมีประกันศูนย์ วิ่งน้อย ประหยัดน้ำมัน',
    '1.2 Premium', 'sedan', NULL, 1197, '2wd', 5, 'private',
    'Toyota Yaris Ativ 1.2 Premium 2023', (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  ),
  (
    'Mazda', 'CX-5', 2021, 979000,
    'กรุงเทพมหานคร', 'petrol', 48000, '[]', 'active', 'auto',
    'สีน้ำเงิน Soul Red',
    'CX-5 2.0 SP ปี 21 ออฟชันเยอะ หนังแท้ หลังคาแก้ว สภาพสวย',
    '2.0 SP', 'suv', NULL, 1998, '2wd', 5, 'private',
    'Mazda CX-5 2.0 SP 2021', (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  ),
  (
    'Ford', 'Ranger', 2022, 679000,
    'นครราชสีมา', 'diesel', 31000, '[]', 'active', 'auto',
    'สีเทา',
    'Ranger Wildtrak 2.0T ปี 22 4x4 อุปกรณ์ครบ ราคาดี',
    'Double Cab Wildtrak 2.0', 'pickup', 'double', 1996, '4wd', 5, 'dealer',
    'Ford Ranger Double Cab Wildtrak 2.0 2022', (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  ),
  (
    'BYD', 'Atto 3', 2023, 1099000,
    'กรุงเทพมหานคร', 'electric', 12000, '[]', 'active', 'auto',
    'สีขาว',
    'BYD Atto 3 Extended Range ปี 23 วิ่ง 420 กม./ชาร์จ แบตเตอรี่ดี ไม่มีค่าน้ำมัน',
    'Extended Range', 'suv', NULL, NULL, '2wd', 5, 'private',
    'BYD Atto 3 Extended Range 2023', (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  ),
  (
    'Toyota', 'Alphard', 2022, 3499000,
    'กรุงเทพมหานคร', 'hybrid', 18000, '[]', 'active', 'auto',
    'สีดำ',
    'Alphard Hybrid SC ปี 22 เบาะ Executive Lounge แทบไม่ได้ใช้ ราคาต่อรอง',
    '2.5 SC Package', 'van', NULL, 2494, '2wd', 7, 'dealer',
    'Toyota Alphard 2.5 SC Package 2022', (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  ),
  (
    'Honda', 'Jazz', 2020, 469000,
    'สมุทรปราการ', 'petrol', 65000, '[]', 'active', 'auto',
    'สีเทา',
    'Jazz 1.5 V+ ปี 20 เครื่องดี ช่วงล่างแน่น พร้อมใช้ ราคาต่อรองได้',
    '1.5 RS', 'hatchback', NULL, 1497, '2wd', 5, 'private',
    'Honda Jazz 1.5 RS 2020', (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  ),
  (
    'Mitsubishi', 'Pajero Sport', 2022, 1249000,
    'ภูเก็ต', 'diesel', 35000, '[]', 'active', 'auto',
    'สีขาวไข่มุก',
    'Pajero Sport GT Premium ปี 22 4WD ออฟชันเต็ม ประวัติดีมาก',
    '2.4 GT Premium', 'ppv', NULL, 2442, '2wd', 7, 'private',
    'Mitsubishi Pajero Sport 2.4 GT Premium 2022', (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  ),
  (
    'BMW', '320d', 2021, 1799000,
    'กรุงเทพมหานคร', 'diesel', 44000, '[]', 'active', 'auto',
    'สีดำ Saphire',
    'BMW 320d M Sport ปี 21 ดีเซล เครื่องดี ประหยัดน้ำมัน อุปกรณ์ครบ',
    'M Sport', 'sedan', NULL, 1995, '2wd', 5, 'dealer',
    'BMW 320d M Sport 2021', (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  ),
  (
    'Toyota', 'Corolla Cross', 2022, 869000,
    'อุดรธานี', 'hybrid', 29000, '[]', 'active', 'auto',
    'สีขาว',
    'Corolla Cross Hybrid HV ปี 22 วิ่งในเมือง ประหยัดน้ำมันมาก สภาพสวย',
    '1.8 HEV Premium', 'suv', NULL, 1798, '2wd', 5, 'private',
    'Toyota Corolla Cross 1.8 HEV Premium 2022', (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  ),
  (
    'Honda', 'CR-V', 2022, 1349000,
    'ปทุมธานี', 'petrol', 25000, '[]', 'active', 'auto',
    'สีขาว',
    'CR-V Turbo EL ปี 22 ออฟชันเต็ม 7 ที่นั่ง หนังแท้ หลังคาแก้ว',
    '2.4 ES 4WD', 'suv', NULL, 2356, 'awd', 7, 'private',
    'Honda CR-V 2.4 ES 4WD 2022', (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  ),
  (
    'Nissan', 'Navara', 2021, 599000,
    'สุราษฎร์ธานี', 'diesel', 58000, '[]', 'active', 'manual',
    'สีเทา',
    'Navara King Cab Calibre EL ปี 21 ดีเซล 2.5 ทำงานไร่ สภาพดี',
    'Double Cab Calibre V', 'pickup', 'double', 2298, '2wd', 5, 'private',
    'Nissan Navara Double Cab Calibre V 2021', (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  ),
  (
    'MG', 'ZS EV', 2023, 699000,
    'กรุงเทพมหานคร', 'electric', 8000, '[]', 'active', 'auto',
    'สีแดง',
    'MG ZS EV Long Range ปี 23 วิ่ง 440 กม./ชาร์จ ยังมีประกัน 3 ปี',
    'Long Range', 'suv', NULL, NULL, '2wd', 5, 'private',
    'MG ZS EV Long Range 2023', (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  ),
  (
    'Toyota', 'Hilux Revo', 2022, 549000,
    'เชียงราย', 'diesel', 42000, '[]', 'active', 'manual',
    'สีขาว',
    'Hilux Revo Smart Cab Entry ปี 22 ดีเซล 2.4 ใช้งานในจังหวัด สภาพดี',
    'Smart Cab Entry 2.4', 'pickup', 'extended', 2393, '2wd', 2, 'private',
    'Toyota Hilux Revo Smart Cab Entry 2.4 2022', (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  ),
  (
    'Honda', 'City', 2022, 639000,
    'กรุงเทพมหานคร', 'hybrid', 19000, '[]', 'active', 'auto',
    'สีเทา Urban',
    'City e:HEV RS ปี 22 ไฮบริด วิ่งน้อย ประวัติศูนย์ครบ พร้อมโอน',
    'e:HEV RS', 'sedan', NULL, 1498, '2wd', 5, 'private',
    'Honda City e:HEV RS 2022', (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  ),
  (
    'Mazda', '2', 2022, 489000,
    'ระยอง', 'petrol', 33000, '[]', 'active', 'auto',
    'สีแดง Soul Red',
    'Mazda2 1.3 SP ปี 22 เบนซิน สภาพสวยมาก ดูแลดี ราคาต่อรองได้',
    '1.3 SP', 'hatchback', NULL, 1298, '2wd', 5, 'private',
    'Mazda 2 1.3 SP 2022', (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1)
  );

-- ── ตัวอย่างรถแต่ง: Civic RS (migration 007) ──────────
WITH civic AS (
  UPDATE public.listings
  SET modification_level = 'moderate'
  WHERE id = (
    SELECT id FROM public.listings
    WHERE brand = 'Honda' AND model = 'Civic' AND year = 2021 AND variant = '1.5 Turbo RS'
    ORDER BY created_at DESC LIMIT 1
  )
  RETURNING id
)
INSERT INTO public.listing_modifications
  (listing_id, category, item, stock_spec, modified_spec, stock_part_included, legal_status, has_receipt)
SELECT civic.id, m.category, m.item, m.stock_spec, m.modified_spec, m.stock_part_included, m.legal_status, m.has_receipt
FROM civic, (VALUES
  ('wheels',     'ล้อแม็ก',       'ล้อ 18 นิ้ว (เดิมติดรถ)', 'ล้อ 18 นิ้ว น้ำหนักเบา + ยางใหม่', true,  'not_required', true),
  ('suspension', 'โช้คอัพ',       'โช้คเดิม',              'โช้คสตรัทปรับเกลียว ปรับนุ่ม-แข็งได้', true,  'not_required', true),
  ('exhaust',    'ท่อไอเสีย',     'ท่อเดิม',               'ปลายท่อสแตนเลส เสียงไม่ดังเกินกฎหมาย', false, 'not_required', false),
  ('other',      'ฟิล์มกรองแสง', 'ไม่มี',                 'ฟิล์มเซรามิก 60%',                    false, 'not_required', true)
) AS m(category, item, stock_spec, modified_spec, stock_part_included, legal_status, has_receipt);
