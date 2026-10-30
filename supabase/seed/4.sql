-- rod2buy seed 4/5 — ประกาศ ชุดที่ 3/3 (15 คัน)
-- รันตามลำดับ 1 → 5 (รันซ้ำได้) · สร้างจาก scripts/seed/generate.mjs

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
