-- rod2buy seed 2/5 — ประกาศ ชุดที่ 1/3 (16 คัน)
-- รันตามลำดับ 1 → 5 (รันซ้ำได้) · สร้างจาก scripts/seed/generate.mjs

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
