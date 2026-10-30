-- =====================================================
-- rod2buy — Shop profiles + Security Advisor fix
-- Run once in Supabase SQL Editor (after 008_model_counts.sql)
-- Safe to re-run.
--
-- 1. price_estimates / seller_scores must read sold listings that RLS hides
--    from visitors, so they run with the owner's rights. Supabase flags such
--    views in the exposed `public` schema as "Security Definer View".
--    The owner-rights part now lives in schema `private` (not reachable via
--    the API) and the public views are plain security_invoker views on top.
--    seller_scores only lists accounts that have listed a car.
-- 2. Shop profile columns: @username, รถบ้าน/เต็นท์, bio, cover, address, hours
-- 3. reveal_seller_contact(): contact button on the shop page
-- =====================================================

-- ── 1. Security Advisor: definer views out of public ──
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

DROP VIEW IF EXISTS public.price_estimates;
DROP VIEW IF EXISTS public.seller_scores;

CREATE OR REPLACE VIEW private.price_estimates AS
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

CREATE OR REPLACE VIEW private.seller_scores AS
SELECT
  p.id AS user_id,
  (SELECT round(avg(r.rating)::numeric, 2)::float8
     FROM public.seller_reviews r WHERE r.seller_id = p.id)          AS avg_rating,
  (SELECT count(*)::integer
     FROM public.seller_reviews r WHERE r.seller_id = p.id)          AS review_count,
  (SELECT count(*)::integer
     FROM public.listings l
     WHERE l.user_id = p.id AND l.status IN ('active', 'sold'))      AS total_listings,
  (SELECT count(*)::integer
     FROM public.listings l
     WHERE l.user_id = p.id AND l.status = 'sold')                   AS sold_count,
  NULL::float8                                                       AS response_rate
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM public.listings l
  WHERE l.user_id = p.id AND l.status IN ('active', 'sold')
);

REVOKE ALL ON private.price_estimates, private.seller_scores FROM PUBLIC;
GRANT SELECT ON private.price_estimates, private.seller_scores TO anon, authenticated;

CREATE VIEW public.price_estimates WITH (security_invoker = true) AS
SELECT * FROM private.price_estimates;

CREATE VIEW public.seller_scores WITH (security_invoker = true) AS
SELECT * FROM private.seller_scores;

GRANT SELECT ON public.price_estimates, public.seller_scores TO anon, authenticated;

-- ── 2. Shop profile columns ───────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username          text,
  ADD COLUMN IF NOT EXISTS account_type      text NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS bio               text,
  ADD COLUMN IF NOT EXISTS cover_url         text,
  ADD COLUMN IF NOT EXISTS shop_address      text,
  ADD COLUMN IF NOT EXISTS business_hours    text,
  ADD COLUMN IF NOT EXISTS business_verified boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_format;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_format
  CHECK (username IS NULL OR username ~ '^[a-z0-9][a-z0-9_.]{1,28}[a-z0-9]$');

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_type_check
  CHECK (account_type IN ('private', 'dealer'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_shop_text_length;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_shop_text_length
  CHECK (char_length(bio) <= 500 AND char_length(shop_address) <= 200 AND char_length(business_hours) <= 100);

-- PDPA: a private seller's address is never stored (only shops show one)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_address_dealer_only;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_address_dealer_only
  CHECK (account_type = 'dealer' OR (shop_address IS NULL AND business_hours IS NULL));

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON public.profiles (username);

-- New public columns readable like display_name (phone / LINE stay hidden)
GRANT SELECT (username, account_type, bio, cover_url, shop_address, business_hours, business_verified)
  ON public.profiles TO anon, authenticated;

-- business_verified is set by admin only — same rule as id_verified (migration 002)
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() is null for service role / SQL editor → allow everything
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role              := 'user';
    NEW.id_verified       := false;
    NEW.phone_verified    := false;
    NEW.verified_at       := NULL;
    NEW.business_verified := false;
  ELSE
    NEW.role              := OLD.role;
    NEW.id_verified       := OLD.id_verified;
    NEW.phone_verified    := OLD.phone_verified;
    NEW.verified_at       := OLD.verified_at;
    -- switching back to รถบ้าน drops the shop badge
    NEW.business_verified := OLD.business_verified AND NEW.account_type = 'dealer';
  END IF;
  RETURN NEW;
END;
$$;

-- ── 3. Contact button on the shop page ────────────────
-- Goes through reveal_contact() with the shop's newest active listing, so the
-- same logging and 20-sellers-per-day limit apply.
CREATE OR REPLACE FUNCTION public.reveal_seller_contact(p_seller_id uuid)
RETURNS TABLE (phone text, line_id text)
LANGUAGE sql
SET search_path = public
AS $$
  SELECT * FROM public.reveal_contact((
    SELECT id FROM public.listings
    WHERE user_id = p_seller_id AND status = 'active'
    ORDER BY created_at DESC LIMIT 1
  ));
$$;

REVOKE EXECUTE ON FUNCTION public.reveal_seller_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reveal_seller_contact(uuid) TO authenticated;
