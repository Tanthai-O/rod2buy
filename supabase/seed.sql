-- ============================================================
-- rod2buy — Seed Data (ข้อมูลตัวอย่าง 20 คัน)
-- รัน schema.sql ก่อน จากนั้นค่อยรันไฟล์นี้
-- ============================================================

INSERT INTO public.listings
  (brand, model, year, price, province, fuel_type, mileage, images, status, transmission, color, description)
VALUES
  (
    'Toyota', 'Camry', 2022, 1199000,
    'กรุงเทพมหานคร', 'hybrid', 28000, '[]', 'active', 'auto',
    'สีเทาดาวเคราะห์',
    'Camry Hybrid 2.5V ปี 22 มือเดียว ออกห้าง ประวัติศูนย์ครบ เอกสารพร้อม'
  ),
  (
    'Honda', 'Civic', 2021, 749000,
    'กรุงเทพมหานคร', 'petrol', 42000, '[]', 'active', 'auto',
    'สีขาวแพลทินัม',
    'Civic RS 1.5 Turbo ปี 21 แต่งสวย ช่วงล่างดี ใช้งานดูแลดี'
  ),
  (
    'Isuzu', 'D-Max', 2022, 645000,
    'ขอนแก่น', 'diesel', 55000, '[]', 'active', 'manual',
    'สีขาว',
    'D-Max Spacecab Hi-Lander ปี 22 ดีเซล 1.9 ใช้งานในจังหวัด สภาพดี'
  ),
  (
    'Toyota', 'Fortuner', 2021, 1099000,
    'เชียงใหม่', 'diesel', 38000, '[]', 'active', 'auto',
    'สีดำ',
    'Fortuner 2.8 Legender 4WD ปี 21 ออฟชันเต็ม ราคาต่อรองได้'
  ),
  (
    'Honda', 'HR-V', 2022, 819000,
    'ชลบุรี', 'petrol', 22000, '[]', 'active', 'auto',
    'สีแดงเลือดนก',
    'HR-V e:HEV RS ปี 22 ไม่เคยชน เช็คศูนย์ตลอด พร้อมใช้'
  ),
  (
    'Toyota', 'Yaris Ativ', 2023, 469000,
    'นนทบุรี', 'petrol', 15000, '[]', 'active', 'auto',
    'สีขาวมุก',
    'Yaris Ativ Sport ปี 23 ยังมีประกันศูนย์ วิ่งน้อย ประหยัดน้ำมัน'
  ),
  (
    'Mazda', 'CX-5', 2021, 979000,
    'กรุงเทพมหานคร', 'petrol', 48000, '[]', 'active', 'auto',
    'สีน้ำเงิน Soul Red',
    'CX-5 2.0 SP ปี 21 ออฟชันเยอะ หนังแท้ หลังคาแก้ว สภาพสวย'
  ),
  (
    'Ford', 'Ranger', 2022, 679000,
    'นครราชสีมา', 'diesel', 31000, '[]', 'active', 'auto',
    'สีเทา',
    'Ranger Wildtrak 2.0T ปี 22 4x4 อุปกรณ์ครบ ราคาดี'
  ),
  (
    'BYD', 'Atto 3', 2023, 1099000,
    'กรุงเทพมหานคร', 'electric', 12000, '[]', 'active', 'auto',
    'สีขาว',
    'BYD Atto 3 Extended Range ปี 23 วิ่ง 420 กม./ชาร์จ แบตเตอรี่ดี ไม่มีค่าน้ำมัน'
  ),
  (
    'Toyota', 'Alphard', 2022, 3499000,
    'กรุงเทพมหานคร', 'hybrid', 18000, '[]', 'active', 'auto',
    'สีดำ',
    'Alphard Hybrid SC ปี 22 เบาะ Executive Lounge แทบไม่ได้ใช้ ราคาต่อรอง'
  ),
  (
    'Honda', 'Jazz', 2020, 469000,
    'สมุทรปราการ', 'petrol', 65000, '[]', 'active', 'auto',
    'สีเทา',
    'Jazz 1.5 V+ ปี 20 เครื่องดี ช่วงล่างแน่น พร้อมใช้ ราคาต่อรองได้'
  ),
  (
    'Mitsubishi', 'Pajero Sport', 2022, 1249000,
    'ภูเก็ต', 'diesel', 35000, '[]', 'active', 'auto',
    'สีขาวไข่มุก',
    'Pajero Sport GT Premium ปี 22 4WD ออฟชันเต็ม ประวัติดีมาก'
  ),
  (
    'BMW', '320d', 2021, 1799000,
    'กรุงเทพมหานคร', 'diesel', 44000, '[]', 'active', 'auto',
    'สีดำ Saphire',
    'BMW 320d M Sport ปี 21 ดีเซล เครื่องดี ประหยัดน้ำมัน อุปกรณ์ครบ'
  ),
  (
    'Toyota', 'Corolla Cross', 2022, 869000,
    'อุดรธานี', 'hybrid', 29000, '[]', 'active', 'auto',
    'สีขาว',
    'Corolla Cross Hybrid HV ปี 22 วิ่งในเมือง ประหยัดน้ำมันมาก สภาพสวย'
  ),
  (
    'Honda', 'CR-V', 2022, 1349000,
    'ปทุมธานี', 'petrol', 25000, '[]', 'active', 'auto',
    'สีขาว',
    'CR-V Turbo EL ปี 22 ออฟชันเต็ม 7 ที่นั่ง หนังแท้ หลังคาแก้ว'
  ),
  (
    'Nissan', 'Navara', 2021, 599000,
    'สุราษฎร์ธานี', 'diesel', 58000, '[]', 'active', 'manual',
    'สีเทา',
    'Navara King Cab Calibre EL ปี 21 ดีเซล 2.5 ทำงานไร่ สภาพดี'
  ),
  (
    'MG', 'ZS EV', 2023, 699000,
    'กรุงเทพมหานคร', 'electric', 8000, '[]', 'active', 'auto',
    'สีแดง',
    'MG ZS EV Long Range ปี 23 วิ่ง 440 กม./ชาร์จ ยังมีประกัน 3 ปี'
  ),
  (
    'Toyota', 'Hilux Revo', 2022, 549000,
    'เชียงราย', 'diesel', 42000, '[]', 'active', 'manual',
    'สีขาว',
    'Hilux Revo Smart Cab Entry ปี 22 ดีเซล 2.4 ใช้งานในจังหวัด สภาพดี'
  ),
  (
    'Honda', 'City', 2022, 639000,
    'กรุงเทพมหานคร', 'hybrid', 19000, '[]', 'active', 'auto',
    'สีเทา Urban',
    'City e:HEV RS ปี 22 ไฮบริด วิ่งน้อย ประวัติศูนย์ครบ พร้อมโอน'
  ),
  (
    'Mazda', 'Mazda2', 2022, 489000,
    'ระยอง', 'petrol', 33000, '[]', 'active', 'auto',
    'สีแดง Soul Red',
    'Mazda2 1.3 SP ปี 22 เบนซิน สภาพสวยมาก ดูแลดี ราคาต่อรองได้'
  );
