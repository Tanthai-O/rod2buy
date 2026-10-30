-- ============================================================
-- rod2buy — Seed Data (สร้างจาก scripts/seed/generate.mjs — อย่าแก้ไฟล์นี้ตรง ๆ)
-- 47 คัน แต่งขึ้นเองทั้งหมด + บัญชีทดสอบ 2 คน
-- รูปรถเป็นภาพวาดประกอบ อยู่ที่ public/seed/cars/ (deploy ไปกับเว็บ)
--
-- รันใน Supabase SQL Editor หลัง migrations ครบ (001–008) — รันซ้ำได้ ไม่สร้างซ้ำ
-- ไฟล์ใหญ่สำหรับมือถือ? ใช้ supabase/seed/ แทน (แบ่งเป็นไฟล์เล็ก รันตามลำดับเลขไฟล์)
--
-- บัญชีทดสอบ (รหัสผ่านเดียวกัน: rod2buy-test-1234)
--   seller@rod2buy.test  — ผู้ขาย ยืนยันตัวตนแล้ว มีประกาศ 27 คัน (รอตรวจ 2, ขายแล้ว 1)
--   buyer@rod2buy.test   — ผู้ซื้อ บัญชีเปล่า ไว้ทดสอบบันทึก/ติดต่อ/รีวิว
-- ⚠ ลบบัญชีทดสอบก่อนเปิดเว็บจริง (Authentication → Users)
-- ============================================================

-- ── บัญชีทดสอบ 2 คน ──
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'ต้องมีบัญชี admin อย่างน้อย 1 คนก่อนรัน seed (UPDATE profiles SET role = ''admin'' WHERE id = ''<your-user-id>'')';
  END IF;
END;
$$;

-- seller@rod2buy.test
INSERT INTO auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, recovery_token, email_change, email_change_token_new,
   email_change_token_current, phone_change, phone_change_token, reauthentication_token)
SELECT '00000000-0000-0000-0000-000000000000', '5eed0000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'seller@rod2buy.test',
  extensions.crypt('rod2buy-test-1234', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"สมชาย ขายรถ (ทดสอบ)"}', now(), now(),
  '', '', '', '', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '5eed0000-0000-4000-8000-000000000001' OR email = 'seller@rod2buy.test');

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), '5eed0000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000001', 'email',
  jsonb_build_object('sub', '5eed0000-0000-4000-8000-000000000001', 'email', 'seller@rod2buy.test', 'email_verified', true), now(), now(), now()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '5eed0000-0000-4000-8000-000000000001')
  AND NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '5eed0000-0000-4000-8000-000000000001' AND provider = 'email');

INSERT INTO public.profiles (id, display_name, phone, line_id, id_verified, verified_at)
SELECT '5eed0000-0000-4000-8000-000000000001', 'สมชาย ขายรถ (ทดสอบ)', '0810000001', 'somchai.test', true, now()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '5eed0000-0000-4000-8000-000000000001')
ON CONFLICT (id) DO UPDATE
  SET display_name = EXCLUDED.display_name, phone = EXCLUDED.phone, line_id = EXCLUDED.line_id,
      id_verified = EXCLUDED.id_verified, verified_at = EXCLUDED.verified_at;

-- buyer@rod2buy.test
INSERT INTO auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, recovery_token, email_change, email_change_token_new,
   email_change_token_current, phone_change, phone_change_token, reauthentication_token)
SELECT '00000000-0000-0000-0000-000000000000', '5eed0000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'buyer@rod2buy.test',
  extensions.crypt('rod2buy-test-1234', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"full_name":"สมหญิง หารถ (ทดสอบ)"}', now(), now(),
  '', '', '', '', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '5eed0000-0000-4000-8000-000000000002' OR email = 'buyer@rod2buy.test');

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), '5eed0000-0000-4000-8000-000000000002', '5eed0000-0000-4000-8000-000000000002', 'email',
  jsonb_build_object('sub', '5eed0000-0000-4000-8000-000000000002', 'email', 'buyer@rod2buy.test', 'email_verified', true), now(), now(), now()
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '5eed0000-0000-4000-8000-000000000002')
  AND NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '5eed0000-0000-4000-8000-000000000002' AND provider = 'email');

INSERT INTO public.profiles (id, display_name, phone, line_id, id_verified, verified_at)
SELECT '5eed0000-0000-4000-8000-000000000002', 'สมหญิง หารถ (ทดสอบ)', '0810000002', NULL, false, NULL
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = '5eed0000-0000-4000-8000-000000000002')
ON CONFLICT (id) DO UPDATE
  SET display_name = EXCLUDED.display_name, phone = EXCLUDED.phone, line_id = EXCLUDED.line_id,
      id_verified = EXCLUDED.id_verified, verified_at = EXCLUDED.verified_at;

-- ── ประกาศ ชุดที่ 1/3 (16 คัน) ──
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'ต้องมีบัญชี admin อย่างน้อย 1 คนก่อนรัน seed (UPDATE profiles SET role = ''admin'' WHERE id = ''<your-user-id>'')';
  END IF;
END;
$$;

WITH v (brand, model, variant, year, price, province, fuel_type, mileage, transmission, color, description, body_type, cab_type, engine_cc, drivetrain, seats, seller_type, num_owners, accident_history, flood_damage, finance_status, status, title, images, owner) AS (VALUES
  ('Toyota', 'Camry', '2.5 HEV Premium', 2022, 1199000, 'กรุงเทพมหานคร', 'hybrid', 28000, 'auto', 'สีเทาดาวเคราะห์', 'Camry Hybrid 2.5V ปี 22 มือเดียว ออกห้าง ประวัติศูนย์ครบ เอกสารพร้อม', 'sedan', NULL, 2487, '2wd', 5, 'private', 1, 'none', false, 'clear', 'active', 'Toyota Camry 2.5 HEV Premium 2022', '["/seed/cars/01-1.webp","/seed/cars/01-2.webp","/seed/cars/01-3.webp"]', 'admin'),
  ('Honda', 'Civic', '1.5 Turbo RS', 2021, 749000, 'กรุงเทพมหานคร', 'petrol', 42000, 'auto', 'สีขาวแพลทินัม', 'Civic RS 1.5 Turbo ปี 21 แต่งสวย ช่วงล่างดี ใช้งานดูแลดี', 'sedan', NULL, 1498, '2wd', 5, 'private', 1, 'none', false, 'clear', 'active', 'Honda Civic 1.5 Turbo RS 2021', '["/seed/cars/02-1.webp","/seed/cars/02-2.webp","/seed/cars/02-3.webp"]', 'admin'),
  ('Isuzu', 'D-Max', 'Spacecab Hi-Lander 1.9', 2022, 645000, 'ขอนแก่น', 'diesel', 55000, 'manual', 'สีขาว', 'D-Max Spacecab Hi-Lander ปี 22 ดีเซล 1.9 ใช้งานในจังหวัด สภาพดี', 'pickup', 'extended', 1898, '2wd', 2, 'private', 1, 'none', false, 'clear', 'active', 'Isuzu D-Max Spacecab Hi-Lander 1.9 2022', '["/seed/cars/03-1.webp","/seed/cars/03-2.webp","/seed/cars/03-3.webp"]', 'admin'),
  ('Toyota', 'Fortuner', '2.8 Legender 4WD', 2021, 1099000, 'เชียงใหม่', 'diesel', 38000, 'auto', 'สีดำ', 'Fortuner 2.8 Legender 4WD ปี 21 ออฟชันเต็ม ราคาต่อรองได้', 'ppv', NULL, 2755, '4wd', 7, 'dealer', 1, 'none', false, 'clear', 'active', 'Toyota Fortuner 2.8 Legender 4WD 2021', '["/seed/cars/04-1.webp","/seed/cars/04-2.webp","/seed/cars/04-3.webp"]', 'admin'),
  ('Honda', 'HR-V', 'e:HEV RS', 2022, 819000, 'ชลบุรี', 'petrol', 22000, 'auto', 'สีแดงเลือดนก', 'HR-V e:HEV RS ปี 22 ไม่เคยชน เช็คศูนย์ตลอด พร้อมใช้', 'suv', NULL, 1498, '2wd', 5, 'private', 1, 'none', false, 'clear', 'active', 'Honda HR-V e:HEV RS 2022', '["/seed/cars/05-1.webp","/seed/cars/05-2.webp","/seed/cars/05-3.webp"]', 'admin'),
  ('Toyota', 'Yaris Ativ', '1.2 Premium', 2023, 469000, 'นนทบุรี', 'petrol', 15000, 'auto', 'สีขาวมุก', 'Yaris Ativ Sport ปี 23 ยังมีประกันศูนย์ วิ่งน้อย ประหยัดน้ำมัน', 'sedan', NULL, 1197, '2wd', 5, 'private', 1, 'none', false, 'clear', 'active', 'Toyota Yaris Ativ 1.2 Premium 2023', '["/seed/cars/06-1.webp","/seed/cars/06-2.webp","/seed/cars/06-3.webp"]', 'admin'),
  ('Mazda', 'CX-5', '2.0 SP', 2021, 979000, 'กรุงเทพมหานคร', 'petrol', 48000, 'auto', 'สีน้ำเงิน Soul Red', 'CX-5 2.0 SP ปี 21 ออฟชันเยอะ หนังแท้ หลังคาแก้ว สภาพสวย', 'suv', NULL, 1998, '2wd', 5, 'private', 1, 'none', false, 'clear', 'active', 'Mazda CX-5 2.0 SP 2021', '["/seed/cars/07-1.webp","/seed/cars/07-2.webp","/seed/cars/07-3.webp"]', 'admin'),
  ('Ford', 'Ranger', 'Double Cab Wildtrak 2.0', 2022, 679000, 'นครราชสีมา', 'diesel', 31000, 'auto', 'สีเทา', 'Ranger Wildtrak 2.0T ปี 22 4x4 อุปกรณ์ครบ ราคาดี', 'pickup', 'double', 1996, '4wd', 5, 'dealer', 1, 'none', false, 'clear', 'active', 'Ford Ranger Double Cab Wildtrak 2.0 2022', '["/seed/cars/08-1.webp","/seed/cars/08-2.webp","/seed/cars/08-3.webp"]', 'admin'),
  ('BYD', 'Atto 3', 'Extended Range', 2023, 1099000, 'กรุงเทพมหานคร', 'electric', 12000, 'auto', 'สีขาว', 'BYD Atto 3 Extended Range ปี 23 วิ่ง 420 กม./ชาร์จ แบตเตอรี่ดี ไม่มีค่าน้ำมัน', 'suv', NULL, NULL, '2wd', 5, 'private', 1, 'none', false, 'clear', 'active', 'BYD Atto 3 Extended Range 2023', '["/seed/cars/09-1.webp","/seed/cars/09-2.webp","/seed/cars/09-3.webp"]', 'admin'),
  ('Toyota', 'Alphard', '2.5 SC Package', 2022, 3499000, 'กรุงเทพมหานคร', 'hybrid', 18000, 'auto', 'สีดำ', 'Alphard Hybrid SC ปี 22 เบาะ Executive Lounge แทบไม่ได้ใช้ ราคาต่อรอง', 'van', NULL, 2494, '2wd', 7, 'dealer', 1, 'none', false, 'clear', 'active', 'Toyota Alphard 2.5 SC Package 2022', '["/seed/cars/10-1.webp","/seed/cars/10-2.webp","/seed/cars/10-3.webp"]', 'admin'),
  ('Honda', 'Jazz', '1.5 RS', 2020, 469000, 'สมุทรปราการ', 'petrol', 65000, 'auto', 'สีเทา', 'Jazz 1.5 V+ ปี 20 เครื่องดี ช่วงล่างแน่น พร้อมใช้ ราคาต่อรองได้', 'hatchback', NULL, 1497, '2wd', 5, 'private', 1, 'none', false, 'clear', 'active', 'Honda Jazz 1.5 RS 2020', '["/seed/cars/11-1.webp","/seed/cars/11-2.webp","/seed/cars/11-3.webp"]', 'admin'),
  ('Mitsubishi', 'Pajero Sport', '2.4 GT Premium', 2022, 1249000, 'ภูเก็ต', 'diesel', 35000, 'auto', 'สีขาวไข่มุก', 'Pajero Sport GT Premium ปี 22 4WD ออฟชันเต็ม ประวัติดีมาก', 'ppv', NULL, 2442, '2wd', 7, 'private', 1, 'none', false, 'clear', 'active', 'Mitsubishi Pajero Sport 2.4 GT Premium 2022', '["/seed/cars/12-1.webp","/seed/cars/12-2.webp","/seed/cars/12-3.webp"]', 'admin'),
  ('BMW', '320d', 'M Sport', 2021, 1799000, 'กรุงเทพมหานคร', 'diesel', 44000, 'auto', 'สีดำ Saphire', 'BMW 320d M Sport ปี 21 ดีเซล เครื่องดี ประหยัดน้ำมัน อุปกรณ์ครบ', 'sedan', NULL, 1995, '2wd', 5, 'dealer', 1, 'none', false, 'clear', 'active', 'BMW 320d M Sport 2021', '["/seed/cars/13-1.webp","/seed/cars/13-2.webp","/seed/cars/13-3.webp"]', 'admin'),
  ('Toyota', 'Corolla Cross', '1.8 HEV Premium', 2022, 869000, 'อุดรธานี', 'hybrid', 29000, 'auto', 'สีขาว', 'Corolla Cross Hybrid HV ปี 22 วิ่งในเมือง ประหยัดน้ำมันมาก สภาพสวย', 'suv', NULL, 1798, '2wd', 5, 'private', 1, 'none', false, 'clear', 'active', 'Toyota Corolla Cross 1.8 HEV Premium 2022', '["/seed/cars/14-1.webp","/seed/cars/14-2.webp","/seed/cars/14-3.webp"]', 'admin'),
  ('Honda', 'CR-V', '2.4 ES 4WD', 2022, 1349000, 'ปทุมธานี', 'petrol', 25000, 'auto', 'สีขาว', 'CR-V Turbo EL ปี 22 ออฟชันเต็ม 7 ที่นั่ง หนังแท้ หลังคาแก้ว', 'suv', NULL, 2356, 'awd', 7, 'private', 1, 'none', false, 'clear', 'active', 'Honda CR-V 2.4 ES 4WD 2022', '["/seed/cars/15-1.webp","/seed/cars/15-2.webp","/seed/cars/15-3.webp"]', 'admin'),
  ('Nissan', 'Navara', 'Double Cab Calibre V', 2021, 599000, 'สุราษฎร์ธานี', 'diesel', 58000, 'manual', 'สีเทา', 'Navara King Cab Calibre EL ปี 21 ดีเซล 2.5 ทำงานไร่ สภาพดี', 'pickup', 'double', 2298, '2wd', 5, 'private', 1, 'none', false, 'clear', 'active', 'Nissan Navara Double Cab Calibre V 2021', '["/seed/cars/16-1.webp","/seed/cars/16-2.webp","/seed/cars/16-3.webp"]', 'admin')
), ins AS (
  INSERT INTO public.listings (brand, model, variant, year, price, province, fuel_type, mileage, transmission, color, description, body_type, cab_type, engine_cc, drivetrain, seats, seller_type, num_owners, accident_history, flood_damage, finance_status, status, title, images, user_id)
  SELECT v.brand::text, v.model::text, v.variant::text, v.year::int, v.price::int, v.province::text, v.fuel_type::text, v.mileage::int, v.transmission::text, v.color::text, v.description::text, v.body_type::text, v.cab_type::text, v.engine_cc::int, v.drivetrain::text, v.seats::int, v.seller_type::text, v.num_owners::int, v.accident_history::text, v.flood_damage::boolean, v.finance_status::text, v.status::text, v.title::text, v.images::jsonb,
    CASE WHEN v.owner = 'seller' THEN '5eed0000-0000-4000-8000-000000000001'::uuid
         ELSE (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1) END
  FROM v
  WHERE NOT EXISTS (SELECT 1 FROM public.listings l WHERE l.title = v.title)
)
-- รันซ้ำ / ประกาศจาก seed เก่าที่ยังไม่มีรูป → ใส่รูปให้
UPDATE public.listings l SET images = v.images::jsonb
FROM v
WHERE l.title = v.title AND jsonb_array_length(l.images::jsonb) = 0;

-- ── ประกาศ ชุดที่ 2/3 (16 คัน) ──
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'ต้องมีบัญชี admin อย่างน้อย 1 คนก่อนรัน seed (UPDATE profiles SET role = ''admin'' WHERE id = ''<your-user-id>'')';
  END IF;
END;
$$;

WITH v (brand, model, variant, year, price, province, fuel_type, mileage, transmission, color, description, body_type, cab_type, engine_cc, drivetrain, seats, seller_type, num_owners, accident_history, flood_damage, finance_status, status, title, images, owner) AS (VALUES
  ('MG', 'ZS EV', 'Long Range', 2023, 699000, 'กรุงเทพมหานคร', 'electric', 9000, 'auto', 'สีแดง', 'MG ZS EV Long Range ปี 23 วิ่ง 440 กม./ชาร์จ ยังมีประกัน 3 ปี', 'suv', NULL, NULL, '2wd', 5, 'private', 1, 'none', false, 'clear', 'active', 'MG ZS EV Long Range 2023', '["/seed/cars/17-1.webp","/seed/cars/17-2.webp","/seed/cars/17-3.webp"]', 'admin'),
  ('Toyota', 'Hilux Revo', 'Smart Cab Entry 2.4', 2022, 549000, 'เชียงราย', 'diesel', 42000, 'manual', 'สีขาว', 'Hilux Revo Smart Cab Entry ปี 22 ดีเซล 2.4 ใช้งานในจังหวัด สภาพดี', 'pickup', 'extended', 2393, '2wd', 2, 'private', 1, 'none', false, 'clear', 'active', 'Toyota Hilux Revo Smart Cab Entry 2.4 2022', '["/seed/cars/18-1.webp","/seed/cars/18-2.webp","/seed/cars/18-3.webp"]', 'admin'),
  ('Honda', 'City', 'e:HEV RS', 2022, 639000, 'กรุงเทพมหานคร', 'hybrid', 19000, 'auto', 'สีเทา Urban', 'City e:HEV RS ปี 22 ไฮบริด วิ่งน้อย ประวัติศูนย์ครบ พร้อมโอน', 'sedan', NULL, 1498, '2wd', 5, 'private', 1, 'none', false, 'clear', 'active', 'Honda City e:HEV RS 2022', '["/seed/cars/19-1.webp","/seed/cars/19-2.webp","/seed/cars/19-3.webp"]', 'admin'),
  ('Mazda', '2', '1.3 SP', 2022, 489000, 'ระยอง', 'petrol', 33000, 'auto', 'สีแดง Soul Red', 'Mazda2 1.3 SP ปี 22 เบนซิน สภาพสวยมาก ดูแลดี ราคาต่อรองได้', 'hatchback', NULL, 1298, '2wd', 5, 'private', 1, 'none', false, 'clear', 'active', 'Mazda 2 1.3 SP 2022', '["/seed/cars/20-1.webp","/seed/cars/20-2.webp","/seed/cars/20-3.webp"]', 'admin'),
  ('Toyota', 'Vios', '1.5 G', 2019, 389000, 'กรุงเทพมหานคร', 'petrol', 89000, 'auto', 'สีบรอนซ์เงิน', 'Vios 1.5 G ปี 19 ใช้ขับไปทำงาน เปลี่ยนยางใหม่ปีที่แล้ว แอร์เย็น ภายในสะอาด', 'sedan', NULL, 1496, '2wd', 5, 'private', 2, 'none', false, 'clear', 'active', 'Toyota Vios 1.5 G 2019', '["/seed/cars/21-1.webp","/seed/cars/21-2.webp","/seed/cars/21-3.webp"]', 'seller'),
  ('Honda', 'Accord', '2.0 e:HEV EL+', 2020, 1159000, 'กรุงเทพมหานคร', 'hybrid', 52000, 'auto', 'สีดำ Crystal', 'Accord Hybrid ปี 20 ตัวท็อป เบาะไฟฟ้า HUD ประวัติศูนย์ทุกระยะ ไม่เคยชน', 'sedan', NULL, 1993, '2wd', 5, 'private', 1, 'none', false, 'clear', 'active', 'Honda Accord 2.0 e:HEV EL+ 2020', '["/seed/cars/22-1.webp","/seed/cars/22-2.webp","/seed/cars/22-3.webp"]', 'seller'),
  ('Mercedes-Benz', 'C300e', 'AMG Dynamic', 2021, 1890000, 'กรุงเทพมหานคร', 'hybrid', 36000, 'auto', 'สีขาว Polar', 'C300e ปลั๊กอินไฮบริด ปี 21 Warranty ศูนย์เหลือ ไฟแนนซ์โปะต่อได้ ดาวน์น้อย', 'sedan', NULL, 1991, '2wd', 5, 'dealer', 1, 'none', false, 'financing', 'active', 'Mercedes-Benz C300e AMG Dynamic 2021', '["/seed/cars/23-1.webp","/seed/cars/23-2.webp","/seed/cars/23-3.webp"]', 'seller'),
  ('Isuzu', 'D-Max', 'Cab4 Hi-Lander 1.9 Z', 2020, 579000, 'นครปฐม', 'diesel', 74000, 'auto', 'สีน้ำเงิน', 'D-Max Cab4 ตัวสูง ปี 20 ออโต้ ใช้งานครอบครัว เข้าศูนย์ตลอด มีสมุดเช็คระยะ', 'pickup', 'double', 1898, '2wd', 5, 'private', 1, 'none', false, 'clear', 'active', 'Isuzu D-Max Cab4 Hi-Lander 1.9 Z 2020', '["/seed/cars/24-1.webp","/seed/cars/24-2.webp","/seed/cars/24-3.webp"]', 'seller'),
  ('Toyota', 'Hilux Revo', 'Standard Cab 2.4 Entry', 2018, 389000, 'สุพรรณบุรี', 'diesel', 142000, 'manual', 'สีขาว', 'Revo ตอนเดียว ปี 18 ใช้บรรทุกของ เครื่องดี เคยเฉี่ยวเล็กน้อยท้ายกระบะ ซ่อมแล้ว', 'pickup', 'single', 2393, '2wd', 2, 'private', 2, 'minor', false, 'clear', 'active', 'Toyota Hilux Revo Standard Cab 2.4 Entry 2018', '["/seed/cars/25-1.webp","/seed/cars/25-2.webp","/seed/cars/25-3.webp"]', 'seller'),
  ('Mitsubishi', 'Triton', 'Double Cab Athlete 4WD', 2022, 899000, 'เชียงใหม่', 'diesel', 41000, 'auto', 'สีส้ม', 'Triton Athlete 4WD ปี 22 ยกสูงจากโรงงาน ขึ้นดอยสบาย รับประกันเครื่องเกียร์ 1 ปี', 'pickup', 'double', 2442, '4wd', 5, 'dealer', 1, 'none', false, 'clear', 'active', 'Mitsubishi Triton Double Cab Athlete 4WD 2022', '["/seed/cars/26-1.webp","/seed/cars/26-2.webp","/seed/cars/26-3.webp"]', 'seller'),
  ('Nissan', 'Almera', '1.0 Turbo VL', 2021, 429000, 'ปทุมธานี', 'petrol', 38000, 'auto', 'สีส้มแดง', 'Almera Turbo VL ปี 21 ตัวท็อป ประหยัดมาก ขับในเมือง ผู้หญิงใช้', 'sedan', NULL, 999, '2wd', 5, 'private', 1, 'none', false, 'clear', 'active', 'Nissan Almera 1.0 Turbo VL 2021', '["/seed/cars/27-1.webp","/seed/cars/27-2.webp","/seed/cars/27-3.webp"]', 'seller'),
  ('Suzuki', 'Swift', '1.2 GLX', 2020, 399000, 'ขอนแก่น', 'petrol', 61000, 'auto', 'สีเหลือง', 'Swift GLX ปี 20 สีเหลืองหายาก ขับสนุก ประหยัด ยางยังเหลือเยอะ', 'hatchback', NULL, 1197, '2wd', 5, 'private', 1, 'none', false, 'clear', 'active', 'Suzuki Swift 1.2 GLX 2020', '["/seed/cars/28-1.webp","/seed/cars/28-2.webp","/seed/cars/28-3.webp"]', 'seller'),
  ('Mazda', '3', '2.0 SP Sports', 2020, 699000, 'กรุงเทพมหานคร', 'petrol', 47000, 'auto', 'สีแดง Soul Red', 'Mazda3 Fastback 2.0 SP ปี 20 หนังแดง เสียงดี Bose ไม่เคยชน ไม่เคยจมน้ำ', 'hatchback', NULL, 1998, '2wd', 5, 'private', 1, 'none', false, 'clear', 'active', 'Mazda 3 2.0 SP Sports 2020', '["/seed/cars/29-1.webp","/seed/cars/29-2.webp","/seed/cars/29-3.webp"]', 'seller'),
  ('Toyota', 'Veloz', '1.5 Premium', 2023, 789000, 'ชลบุรี', 'petrol', 14000, 'auto', 'สีเทา', 'Veloz Premium ปี 23 รถครอบครัว 7 ที่นั่ง ยังมีประกันศูนย์ ใช้น้อย', 'mpv', NULL, 1496, '2wd', 7, 'private', 1, 'none', false, 'clear', 'active', 'Toyota Veloz 1.5 Premium 2023', '["/seed/cars/30-1.webp","/seed/cars/30-2.webp","/seed/cars/30-3.webp"]', 'seller'),
  ('Mitsubishi', 'Xpander Cross', '1.5', 2021, 649000, 'นครราชสีมา', 'petrol', 56000, 'auto', 'สีน้ำตาล', 'Xpander Cross ปี 21 ใต้ท้องสูง 7 ที่นั่ง เหมาะกับครอบครัว เข้าศูนย์ตลอด', 'mpv', NULL, 1499, '2wd', 7, 'private', 1, 'none', false, 'clear', 'active', 'Mitsubishi Xpander Cross 1.5 2021', '["/seed/cars/31-1.webp","/seed/cars/31-2.webp","/seed/cars/31-3.webp"]', 'seller'),
  ('Hyundai', 'Staria', '2.2 SEL', 2022, 1490000, 'กรุงเทพมหานคร', 'diesel', 33000, 'auto', 'สีเงิน', 'Staria SEL 11 ที่นั่ง ปี 22 ใช้รับส่งพนักงาน ภายในกว้าง ประตูไฟฟ้า', 'van', NULL, 2199, '2wd', 11, 'dealer', 1, 'none', false, 'clear', 'active', 'Hyundai Staria 2.2 SEL 2022', '["/seed/cars/32-1.webp","/seed/cars/32-2.webp","/seed/cars/32-3.webp"]', 'seller')
), ins AS (
  INSERT INTO public.listings (brand, model, variant, year, price, province, fuel_type, mileage, transmission, color, description, body_type, cab_type, engine_cc, drivetrain, seats, seller_type, num_owners, accident_history, flood_damage, finance_status, status, title, images, user_id)
  SELECT v.brand::text, v.model::text, v.variant::text, v.year::int, v.price::int, v.province::text, v.fuel_type::text, v.mileage::int, v.transmission::text, v.color::text, v.description::text, v.body_type::text, v.cab_type::text, v.engine_cc::int, v.drivetrain::text, v.seats::int, v.seller_type::text, v.num_owners::int, v.accident_history::text, v.flood_damage::boolean, v.finance_status::text, v.status::text, v.title::text, v.images::jsonb,
    CASE WHEN v.owner = 'seller' THEN '5eed0000-0000-4000-8000-000000000001'::uuid
         ELSE (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1) END
  FROM v
  WHERE NOT EXISTS (SELECT 1 FROM public.listings l WHERE l.title = v.title)
)
-- รันซ้ำ / ประกาศจาก seed เก่าที่ยังไม่มีรูป → ใส่รูปให้
UPDATE public.listings l SET images = v.images::jsonb
FROM v
WHERE l.title = v.title AND jsonb_array_length(l.images::jsonb) = 0;

-- ── ประกาศ ชุดที่ 3/3 (15 คัน) ──
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'ต้องมีบัญชี admin อย่างน้อย 1 คนก่อนรัน seed (UPDATE profiles SET role = ''admin'' WHERE id = ''<your-user-id>'')';
  END IF;
END;
$$;

WITH v (brand, model, variant, year, price, province, fuel_type, mileage, transmission, color, description, body_type, cab_type, engine_cc, drivetrain, seats, seller_type, num_owners, accident_history, flood_damage, finance_status, status, title, images, owner) AS (VALUES
  ('Toyota', 'Commuter', '2.8 Standard Roof', 2019, 899000, 'สมุทรสาคร', 'diesel', 168000, 'manual', 'สีขาว', 'Commuter หลังคาเตี้ย ปี 19 15 ที่นั่ง เครื่องแรง ทำทัวร์ได้ทันที', 'van', NULL, 2755, '2wd', 15, 'dealer', 2, 'none', false, 'clear', 'active', 'Toyota Commuter 2.8 Standard Roof 2019', '["/seed/cars/33-1.webp","/seed/cars/33-2.webp","/seed/cars/33-3.webp"]', 'seller'),
  ('Isuzu', 'MU-X', '1.9 Elegant', 2021, 999000, 'อุบลราชธานี', 'diesel', 49000, 'auto', 'สีเทาเข้ม', 'MU-X Elegant ปี 21 รุ่นใหม่ จอใหญ่ กล้องรอบคัน ขับทางไกลสบาย', 'ppv', NULL, 1898, '2wd', 7, 'private', 1, 'none', false, 'clear', 'active', 'Isuzu MU-X 1.9 Elegant 2021', '["/seed/cars/34-1.webp","/seed/cars/34-2.webp","/seed/cars/34-3.webp"]', 'seller'),
  ('Ford', 'Everest', '2.0 Titanium+ 4WD', 2020, 1099000, 'ภูเก็ต', 'diesel', 68000, 'auto', 'สีน้ำตาลทอง', 'Everest Titanium+ ปี 20 เคยลุยน้ำท่วมระดับล้อ เปลี่ยนพรมและเช็คระบบไฟแล้ว ราคาจึงต่ำกว่าตลาด', 'ppv', NULL, 1996, '4wd', 7, 'private', 1, 'none', true, 'clear', 'active', 'Ford Everest 2.0 Titanium+ 4WD 2020', '["/seed/cars/35-1.webp","/seed/cars/35-2.webp","/seed/cars/35-3.webp"]', 'seller'),
  ('Kia', 'Carnival', '2.2 SXL', 2022, 2290000, 'กรุงเทพมหานคร', 'diesel', 27000, 'auto', 'สีดำ', 'Carnival SXL ปี 22 ตัวท็อป ประตูสไลด์ไฟฟ้า ซันรูฟ 2 ตอน สภาพป้ายแดง', 'mpv', NULL, 2151, '2wd', 11, 'dealer', 1, 'none', false, 'clear', 'active', 'Kia Carnival 2.2 SXL 2022', '["/seed/cars/36-1.webp","/seed/cars/36-2.webp","/seed/cars/36-3.webp"]', 'seller'),
  ('Tesla', 'Model 3', 'Long Range AWD', 2023, 1390000, 'กรุงเทพมหานคร', 'electric', 21000, 'auto', 'สีน้ำเงิน', 'Model 3 Long Range ปี 23 Autopilot แบตเตอรี่ 97% วิ่งได้ 560 กม. ชาร์จบ้าน', 'sedan', NULL, NULL, 'awd', 5, 'private', 1, 'none', false, 'clear', 'active', 'Tesla Model 3 Long Range AWD 2023', '["/seed/cars/37-1.webp","/seed/cars/37-2.webp","/seed/cars/37-3.webp"]', 'seller'),
  ('BYD', 'Dolphin', 'Extended Range', 2024, 599000, 'เชียงใหม่', 'electric', 8000, 'auto', 'สีชมพู', 'Dolphin ปี 24 วิ่งน้อยมาก ใช้ในเมือง ชาร์จที่คอนโด ประกันชั้น 1 เหลือ 8 เดือน', 'hatchback', NULL, NULL, '2wd', 5, 'private', 1, 'none', false, 'clear', 'active', 'BYD Dolphin Extended Range 2024', '["/seed/cars/38-1.webp","/seed/cars/38-2.webp","/seed/cars/38-3.webp"]', 'seller'),
  ('Subaru', 'Forester', '2.0i-S EyeSight', 2020, 889000, 'นนทบุรี', 'petrol', 57000, 'auto', 'สีเขียว', 'Forester EyeSight ปี 20 ขับเคลื่อน 4 ล้อตลอดเวลา ระบบความปลอดภัยครบ', 'suv', NULL, 1995, 'awd', 5, 'private', 1, 'none', false, 'clear', 'active', 'Subaru Forester 2.0i-S EyeSight 2020', '["/seed/cars/39-1.webp","/seed/cars/39-2.webp","/seed/cars/39-3.webp"]', 'seller'),
  ('Honda', 'Civic', '1.8 EL', 2017, 549000, 'นครศรีธรรมราช', 'petrol', 118000, 'auto', 'สีขาว', 'Civic FC 1.8 EL ปี 17 เคยชนหน้าหนัก ซ่อมศูนย์ประกัน มีรูปก่อนซ่อมให้ดู ขายถูก', 'sedan', NULL, 1799, '2wd', 5, 'private', 3, 'major', false, 'clear', 'active', 'Honda Civic 1.8 EL 2017', '["/seed/cars/40-1.webp","/seed/cars/40-2.webp","/seed/cars/40-3.webp"]', 'seller'),
  ('Suzuki', 'Jimny', '1.5 4WD', 2022, 1290000, 'เชียงราย', 'petrol', 19000, 'manual', 'สีเขียวขี้ม้า', 'Jimny เกียร์ธรรมดา ปี 22 หายาก ลุยได้จริง ใส่ล้อแม็ก+ยาง AT', 'suv', NULL, 1462, '4wd', 4, 'private', 1, 'none', false, 'clear', 'active', 'Suzuki Jimny 1.5 4WD 2022', '["/seed/cars/41-1.webp","/seed/cars/41-2.webp","/seed/cars/41-3.webp"]', 'seller'),
  ('Mazda', 'MX-5', '2.0 RF', 2019, 1790000, 'กรุงเทพมหานคร', 'petrol', 23000, 'manual', 'สีเทา Machine', 'MX-5 RF หลังคาแข็งพับได้ ปี 19 ขับวันหยุด เก็บในร่ม ไม่เคยลงสนาม', 'coupe', NULL, 1998, '2wd', 2, 'private', 1, 'none', false, 'clear', 'active', 'Mazda MX-5 2.0 RF 2019', '["/seed/cars/42-1.webp","/seed/cars/42-2.webp","/seed/cars/42-3.webp"]', 'seller'),
  ('Ford', 'Mustang', '2.3 EcoBoost', 2018, 1990000, 'กรุงเทพมหานคร', 'petrol', 39000, 'auto', 'สีเหลือง', 'Mustang 2.3 EcoBoost ปี 18 ป้ายแดงศูนย์ไทย เบาะ Recaro ประวัติดี', 'coupe', NULL, 2261, '2wd', 4, 'dealer', 2, 'none', false, 'clear', 'active', 'Ford Mustang 2.3 EcoBoost 2018', '["/seed/cars/43-1.webp","/seed/cars/43-2.webp","/seed/cars/43-3.webp"]', 'seller'),
  ('Toyota', 'Corolla Altis', '1.8 GR Sport', 2021, 789000, 'สงขลา', 'hybrid', 44000, 'auto', 'สีดำ', 'Altis GR Sport ปี 21 ปิดไฟแนนซ์แล้ว เล่มอยู่ในมือ โอนได้ทันที', 'sedan', NULL, 1798, '2wd', 5, 'private', 1, 'none', false, 'paid_off', 'active', 'Toyota Corolla Altis 1.8 GR Sport 2021', '["/seed/cars/44-1.webp","/seed/cars/44-2.webp","/seed/cars/44-3.webp"]', 'seller'),
  ('Nissan', 'Kicks', 'e-Power VL', 2022, 679000, 'กรุงเทพมหานคร', 'hybrid', 26000, 'auto', 'สีขาว', 'Kicks e-Power ปี 22 ขับเหมือนรถไฟฟ้า ไม่ต้องชาร์จ (ประกาศนี้รอแอดมินตรวจ)', 'suv', NULL, 1198, '2wd', 5, 'private', 1, 'none', false, 'clear', 'pending', 'Nissan Kicks e-Power VL 2022', '["/seed/cars/45-1.webp","/seed/cars/45-2.webp","/seed/cars/45-3.webp"]', 'seller'),
  ('MG', 'MG4 Electric', 'X', 2023, 739000, 'ระยอง', 'electric', 11000, 'auto', 'สีฟ้า', 'MG4 Electric X ปี 23 ขับหลัง ช่วงล่างดี (ประกาศนี้รอแอดมินตรวจ)', 'hatchback', NULL, NULL, '2wd', 5, 'private', 1, 'none', false, 'clear', 'pending', 'MG MG4 Electric X 2023', '["/seed/cars/46-1.webp","/seed/cars/46-2.webp","/seed/cars/46-3.webp"]', 'seller'),
  ('Honda', 'BR-V', '1.5 EL', 2020, 559000, 'พิษณุโลก', 'petrol', 63000, 'auto', 'สีเทา', 'BR-V 7 ที่นั่ง ปี 20 (ขายแล้ว — ไว้ทดสอบป้ายขายแล้ว)', 'mpv', NULL, 1497, '2wd', 7, 'private', 1, 'none', false, 'clear', 'sold', 'Honda BR-V 1.5 EL 2020', '["/seed/cars/47-1.webp","/seed/cars/47-2.webp","/seed/cars/47-3.webp"]', 'seller')
), ins AS (
  INSERT INTO public.listings (brand, model, variant, year, price, province, fuel_type, mileage, transmission, color, description, body_type, cab_type, engine_cc, drivetrain, seats, seller_type, num_owners, accident_history, flood_damage, finance_status, status, title, images, user_id)
  SELECT v.brand::text, v.model::text, v.variant::text, v.year::int, v.price::int, v.province::text, v.fuel_type::text, v.mileage::int, v.transmission::text, v.color::text, v.description::text, v.body_type::text, v.cab_type::text, v.engine_cc::int, v.drivetrain::text, v.seats::int, v.seller_type::text, v.num_owners::int, v.accident_history::text, v.flood_damage::boolean, v.finance_status::text, v.status::text, v.title::text, v.images::jsonb,
    CASE WHEN v.owner = 'seller' THEN '5eed0000-0000-4000-8000-000000000001'::uuid
         ELSE (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1) END
  FROM v
  WHERE NOT EXISTS (SELECT 1 FROM public.listings l WHERE l.title = v.title)
)
-- รันซ้ำ / ประกาศจาก seed เก่าที่ยังไม่มีรูป → ใส่รูปให้
UPDATE public.listings l SET images = v.images::jsonb
FROM v
WHERE l.title = v.title AND jsonb_array_length(l.images::jsonb) = 0;

-- ── รถแต่ง + ประวัติรถ ──
-- ── ตัวอย่างรถแต่ง: Civic RS (migration 007) ──────────
WITH civic AS (
  UPDATE public.listings
  SET modification_level = 'moderate'
  WHERE id = (
    SELECT id FROM public.listings
    WHERE title = 'Honda Civic 1.5 Turbo RS 2021'
    ORDER BY created_at DESC LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.listing_modifications m
    JOIN public.listings l ON l.id = m.listing_id
    WHERE l.title = 'Honda Civic 1.5 Turbo RS 2021'
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

-- ── ประวัติรถ (Car History Card) ─────────────────────
INSERT INTO public.car_events (listing_id, event_date, event_type, description, mileage_at)
SELECT l.id, e.event_date, e.event_type, e.description, e.mileage_at
FROM (VALUES
  ('Toyota Camry 2.5 HEV Premium 2022', '2023-03-10'::date, 'ตรวจสภาพ', 'เช็คระยะ 10,000 กม. ที่ศูนย์', 10000),
  ('Toyota Camry 2.5 HEV Premium 2022', '2024-02-18'::date, 'เปลี่ยนอะไหล่', 'เปลี่ยนยาง 4 เส้น Michelin Primacy', 21000),
  ('Toyota Vios 1.5 G 2019', '2021-06-02'::date, 'ซ่อม', 'เปลี่ยนคอมแอร์', 45000),
  ('Toyota Vios 1.5 G 2019', '2023-09-15'::date, 'เปลี่ยนอะไหล่', 'เปลี่ยนยาง + ผ้าเบรกหน้า', 78000),
  ('Toyota Hilux Revo Standard Cab 2.4 Entry 2018', '2020-11-20'::date, 'อุบัติเหตุ', 'เฉี่ยวท้ายกระบะ ซ่อมสีฝาท้าย', 70000),
  ('Toyota Hilux Revo Standard Cab 2.4 Entry 2018', '2024-05-01'::date, 'เปลี่ยนอะไหล่', 'เปลี่ยนคลัตช์ชุดใหม่', 130000),
  ('Honda Civic 1.8 EL 2017', '2019-08-12'::date, 'อุบัติเหตุ', 'ชนด้านหน้า ประกันซ่อมที่ศูนย์ เปลี่ยนหม้อน้ำ กันชน ไฟหน้า', 52000),
  ('Honda Civic 1.8 EL 2017', '2022-01-30'::date, 'ตรวจสภาพ', 'ตรวจสภาพตรอ. ผ่าน', 88000),
  ('Ford Everest 2.0 Titanium+ 4WD 2020', '2022-10-05'::date, 'ซ่อม', 'ลุยน้ำท่วมระดับล้อ เปลี่ยนพรม ล้างระบบเบรก เช็คปลั๊กไฟ', 51000),
  ('Tesla Model 3 Long Range AWD 2023', '2024-07-20'::date, 'ตรวจสภาพ', 'ตรวจแบตเตอรี่ที่ศูนย์ สุขภาพแบต 97%', 15000)
) AS e(title, event_date, event_type, description, mileage_at)
JOIN LATERAL (
  SELECT id FROM public.listings WHERE title = e.title ORDER BY created_at LIMIT 1
) l ON true
WHERE NOT EXISTS (
  SELECT 1 FROM public.car_events c
  WHERE c.listing_id = l.id AND c.event_date = e.event_date AND c.event_type = e.event_type
);
