-- rod2buy seed 6/6 — หน้าร้านของผู้ขายทดสอบ (ต้องรัน migration 009 ก่อน)
-- รันตามลำดับ 1 → 6 (รันซ้ำได้) · สร้างจาก scripts/seed/generate.mjs

UPDATE public.profiles SET
  username = 'somchaicar',
  account_type = 'dealer',
  bio = 'เต็นท์รถมือสองคุณภาพ (บัญชีทดสอบ)
รับประกันเครื่องเกียร์ 1 ปี · มีไฟแนนซ์ ดาวน์น้อย · รับเทิร์นรถทุกยี่ห้อ',
  shop_address = 'ถนนพหลโยธิน อำเภอเมือง จังหวัดปทุมธานี (ที่อยู่สมมติ)',
  business_hours = 'ทุกวัน 08:30–18:30',
  business_verified = true
WHERE id = '5eed0000-0000-4000-8000-000000000001';
