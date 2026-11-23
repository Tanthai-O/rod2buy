-- รันใน Supabase SQL Editor (production) เพื่อเทียบกับ supabase/migrations/000_base.sql
-- อ่านอย่างเดียว ไม่แก้อะไร — คัดลอกผลลัพธ์ทั้งตารางมาเทียบ
SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'listings', 'car_events', 'saved_listings', 'response_logs')
ORDER BY table_name, ordinal_position;
