-- rod2buy seed 3/5 — ประกาศ ชุดที่ 2/3 (16 คัน)
-- รันตามลำดับ 1 → 5 (รันซ้ำได้) · สร้างจาก scripts/seed/generate.mjs

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
