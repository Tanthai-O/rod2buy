-- =====================================================
-- rod2buy — Move chassis number + registration book out of public listings
-- Run once in Supabase SQL Editor (after 003_contact_mfa.sql)
-- Safe to re-run.
--
-- Before this, public_read_active_listings let anyone (no login) read
-- listings.chassis_number and listings.registration_book_image via REST.
-- A full VIN is enough to clone a car's identity (รถสวมทะเบียน).
-- =====================================================

-- ── 0. helper (same as 002 — repeated so this file runs on its own) ─
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── 1. private table: owner + admin only ─────────────
CREATE TABLE IF NOT EXISTS public.listing_private (
  listing_id              uuid PRIMARY KEY REFERENCES public.listings(id) ON DELETE CASCADE,
  chassis_number          text,
  registration_book_image text,
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_private ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.listing_private FROM anon;

DROP POLICY IF EXISTS "owner_manage_listing_private" ON public.listing_private;
CREATE POLICY "owner_manage_listing_private" ON public.listing_private
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_read_listing_private" ON public.listing_private;
CREATE POLICY "admin_read_listing_private" ON public.listing_private
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- ── 2. public yes/no flags (for badges + filters) ────
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS has_registration_book boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_chassis_number    boolean NOT NULL DEFAULT false;

-- ── 3. copy existing data, then drop the public columns ─
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'chassis_number'
  ) THEN
    EXECUTE $q$
      INSERT INTO public.listing_private (listing_id, chassis_number, registration_book_image)
      SELECT id, NULLIF(trim(chassis_number), ''), registration_book_image
      FROM public.listings
      WHERE NULLIF(trim(chassis_number), '') IS NOT NULL OR registration_book_image IS NOT NULL
      ON CONFLICT (listing_id) DO UPDATE
        SET chassis_number          = EXCLUDED.chassis_number,
            registration_book_image = EXCLUDED.registration_book_image
    $q$;
    ALTER TABLE public.listings
      DROP COLUMN chassis_number,
      DROP COLUMN registration_book_image;
  END IF;
END;
$$;

-- ── 4. flags are always derived from listing_private ─
-- Owners can update their listing row, so they must not be able to set
-- has_registration_book themselves — recompute on every write.
CREATE OR REPLACE FUNCTION public.derive_listing_doc_flags()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT
    coalesce(bool_or(p.registration_book_image IS NOT NULL), false),
    coalesce(bool_or(NULLIF(trim(p.chassis_number), '') IS NOT NULL), false)
  INTO NEW.has_registration_book, NEW.has_chassis_number
  FROM public.listing_private p
  WHERE p.listing_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_derive_doc_flags ON public.listings;
CREATE TRIGGER listings_derive_doc_flags
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.derive_listing_doc_flags();

-- When the private row changes, touch the listing so the trigger above re-derives
CREATE OR REPLACE FUNCTION public.touch_listing_doc_flags()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.listings
  SET has_registration_book = has_registration_book
  WHERE id = coalesce(NEW.listing_id, OLD.listing_id);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS listing_private_touch_flags ON public.listing_private;
CREATE TRIGGER listing_private_touch_flags
  AFTER INSERT OR UPDATE OR DELETE ON public.listing_private
  FOR EACH ROW EXECUTE FUNCTION public.touch_listing_doc_flags();

-- Backfill flags for existing rows
UPDATE public.listings SET has_registration_book = has_registration_book;

-- ── 5. leftover: old registration books in the PUBLIC car-images bucket ─
-- Older uploads stored the reg book in car-images (public). Those files are
-- still reachable by anyone who has the URL. List them, then re-upload or delete:
--
--   SELECT listing_id, registration_book_image
--   FROM public.listing_private
--   WHERE registration_book_image NOT LIKE '%/reg_book/%';
