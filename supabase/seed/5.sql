-- rod2buy seed 5/5 — รถแต่ง + ประวัติรถ
-- รันตามลำดับ 1 → 5 (รันซ้ำได้) · สร้างจาก scripts/seed/generate.mjs

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
