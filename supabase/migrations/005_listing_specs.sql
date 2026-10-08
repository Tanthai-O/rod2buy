-- =====================================================
-- rod2buy — More structured specs (for filters that match the market)
-- Run once in Supabase SQL Editor (after 004_private_docs.sql)
-- Safe to re-run.
--
-- All new columns are nullable / defaulted so existing listings keep working.
-- =====================================================

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS variant     text,      -- รุ่นย่อย เช่น Hi-Lander Z, Legender, RS
  ADD COLUMN IF NOT EXISTS body_type   text,
  ADD COLUMN IF NOT EXISTS cab_type    text,      -- pickups only
  ADD COLUMN IF NOT EXISTS engine_cc   integer,   -- null for EVs
  ADD COLUMN IF NOT EXISTS drivetrain  text,
  ADD COLUMN IF NOT EXISTS seats       smallint,
  ADD COLUMN IF NOT EXISTS seller_type text NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS district    text;      -- อำเภอ/เขต

-- ── constraints (drop first so re-runs pick up changes) ─
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_variant_len,
  DROP CONSTRAINT IF EXISTS listings_body_type_check,
  DROP CONSTRAINT IF EXISTS listings_cab_type_check,
  DROP CONSTRAINT IF EXISTS listings_engine_cc_check,
  DROP CONSTRAINT IF EXISTS listings_drivetrain_check,
  DROP CONSTRAINT IF EXISTS listings_seats_check,
  DROP CONSTRAINT IF EXISTS listings_seller_type_check,
  DROP CONSTRAINT IF EXISTS listings_district_len;

ALTER TABLE public.listings
  ADD CONSTRAINT listings_variant_len CHECK (variant IS NULL OR char_length(variant) <= 100),
  ADD CONSTRAINT listings_body_type_check CHECK (
    body_type IS NULL OR body_type IN
      ('sedan', 'hatchback', 'pickup', 'suv', 'ppv', 'mpv', 'van', 'coupe', 'convertible', 'wagon')
  ),
  ADD CONSTRAINT listings_cab_type_check CHECK (
    cab_type IS NULL OR (cab_type IN ('single', 'extended', 'double') AND body_type = 'pickup')
  ),
  ADD CONSTRAINT listings_engine_cc_check CHECK (engine_cc IS NULL OR engine_cc BETWEEN 50 AND 10000),
  ADD CONSTRAINT listings_drivetrain_check CHECK (drivetrain IS NULL OR drivetrain IN ('2wd', '4wd', 'awd')),
  ADD CONSTRAINT listings_seats_check CHECK (seats IS NULL OR seats BETWEEN 1 AND 16),
  ADD CONSTRAINT listings_seller_type_check CHECK (seller_type IN ('private', 'dealer')),
  ADD CONSTRAINT listings_district_len CHECK (district IS NULL OR char_length(district) <= 100);

-- ── indexes for the browse page ──────────────────────
-- Every browse query filters status = 'active', so partial indexes stay small.
CREATE INDEX IF NOT EXISTS listings_active_created_idx
  ON public.listings (created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS listings_active_brand_model_idx
  ON public.listings (brand, model) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS listings_active_body_type_idx
  ON public.listings (body_type) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS listings_active_price_idx
  ON public.listings (price) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS listings_active_province_idx
  ON public.listings (province) WHERE status = 'active';
