-- =====================================================
-- rod2buy — Modified / tuned cars (รถแต่ง / รถจูน)
-- Run once in Supabase SQL Editor (after 006_fix_listing_policies.sql)
-- Safe to re-run.
--
-- listings.modification_level = how modified the car is (filterable)
-- listing_modifications       = one row per modification, with the stock
--                               value next to the current one (เดิม ↔ แต่ง)
-- car_events stays for things that HAPPENED (repairs); this table is what
-- the car IS now.
-- =====================================================

-- ── 1. level on the listing ──────────────────────────
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS modification_level text NOT NULL DEFAULT 'stock';

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_modification_level_check;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_modification_level_check
  CHECK (modification_level IN ('stock', 'light', 'moderate', 'heavy'));

-- ── 2. modification list ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.listing_modifications (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id          uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  category            text NOT NULL,
  item                text NOT NULL,
  stock_spec          text,             -- เดิม  e.g. "ล้อ 17 นิ้ว"
  modified_spec       text,             -- ตอนนี้ e.g. "ล้อแม็ก 18 นิ้ว Enkei"
  stock_part_included boolean NOT NULL DEFAULT false,  -- ของเดิมแถมให้ / คืนสภาพได้
  legal_status        text NOT NULL DEFAULT 'not_required',
  has_receipt         boolean NOT NULL DEFAULT false,
  installed_at        date,
  created_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT listing_modifications_category_check CHECK (category IN (
    'engine', 'forced_induction', 'exhaust', 'suspension', 'wheels',
    'brakes', 'body', 'interior', 'audio', 'lighting', 'gas_kit', 'other'
  )),
  CONSTRAINT listing_modifications_legal_check
    CHECK (legal_status IN ('registered', 'not_registered', 'not_required')),
  CONSTRAINT listing_modifications_item_len     CHECK (char_length(item) BETWEEN 1 AND 100),
  CONSTRAINT listing_modifications_stock_len    CHECK (stock_spec IS NULL OR char_length(stock_spec) <= 200),
  CONSTRAINT listing_modifications_modified_len CHECK (modified_spec IS NULL OR char_length(modified_spec) <= 200)
);

CREATE INDEX IF NOT EXISTS listing_modifications_listing_idx
  ON public.listing_modifications (listing_id);

ALTER TABLE public.listing_modifications ENABLE ROW LEVEL SECURITY;

-- Readable whenever the listing itself is readable: the subquery runs under the
-- caller's listings RLS (public → active only, owner → own, admin → all).
DROP POLICY IF EXISTS "read_with_listing" ON public.listing_modifications;
CREATE POLICY "read_with_listing" ON public.listing_modifications
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id));

DROP POLICY IF EXISTS "owner_manage_modifications" ON public.listing_modifications;
CREATE POLICY "owner_manage_modifications" ON public.listing_modifications
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
  );

-- Cap per listing so one listing can't fill the table
CREATE OR REPLACE FUNCTION public.limit_listing_modifications()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM public.listing_modifications WHERE listing_id = NEW.listing_id) >= 30 THEN
    RAISE EXCEPTION 'เพิ่มรายการของแต่งได้สูงสุด 30 รายการต่อประกาศ';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listing_modifications_limit ON public.listing_modifications;
CREATE TRIGGER listing_modifications_limit
  BEFORE INSERT ON public.listing_modifications
  FOR EACH ROW EXECUTE FUNCTION public.limit_listing_modifications();

-- ── 3. Price Estimator: heavily tuned cars skew the market average ─
CREATE OR REPLACE VIEW public.price_estimates AS
SELECT
  brand,
  model,
  year,
  round(avg(price))::integer AS avg_price,
  min(price)::integer        AS min_price,
  max(price)::integer        AS max_price,
  count(*)::integer          AS sample_count
FROM public.listings
WHERE status IN ('active', 'sold')
  AND modification_level <> 'heavy'
GROUP BY brand, model, year;
