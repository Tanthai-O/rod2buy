-- =====================================================
-- rod2buy — Image URLs must point at our own Storage
-- Run once in Supabase SQL Editor (after 013_stats_ranges.sql)
-- Safe to re-run.
--
-- RLS lets owners update their own listings / profile / inspection reports
-- straight through the REST API, so the server actions' URL checks could be
-- skipped. The share-card renderer fetches these URLs server-side, and the pages
-- show them. These rules hold whatever client writes the row:
--   listings.images            → car-images/{user_id}/…  (or a bundled /seed/cars/ drawing)
--   inspection_reports.images  → inspector-media/{inspector_id}/…
--   profiles.cover_url         → car-images/{id}/profile/…
-- The SQL Editor / service role (auth.uid() IS NULL) is not checked, so seeding works.
-- Existing rows are left as they are (NOT VALID / triggers only fire on writes).
-- =====================================================

CREATE SCHEMA IF NOT EXISTS private;

-- https://<project>.supabase.co/storage/v1/object/public/<bucket>/<owner>/<subfolder><file path>
-- File path: plain segments only (no "..", no query string)
CREATE OR REPLACE FUNCTION private.is_own_storage_url(p_url text, p_bucket text, p_owner uuid, p_subfolder text DEFAULT '')
RETURNS boolean
LANGUAGE sql IMMUTABLE
SET search_path = ''
AS $$
  SELECT p_url IS NOT NULL
    AND p_url ~ ('^https://[a-z0-9]+\.supabase\.(co|in)/storage/v1/object/public/'
                 || p_bucket || '/' || p_owner::text || '/' || p_subfolder
                 || '([A-Za-z0-9_.-]+/)*[A-Za-z0-9_.-]+$')
    AND p_url !~ '/\.\.?(/|$)';
$$;

-- ── listings.images ───────────────────────────────────
CREATE OR REPLACE FUNCTION private.check_listing_images()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_url text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF jsonb_typeof(NEW.images::jsonb) <> 'array' OR jsonb_array_length(NEW.images::jsonb) > 10 THEN
    RAISE EXCEPTION 'invalid_images' USING ERRCODE = 'check_violation';
  END IF;
  FOR v_url IN SELECT jsonb_array_elements_text(NEW.images::jsonb) LOOP
    IF NOT (private.is_own_storage_url(v_url, 'car-images', NEW.user_id)
            OR v_url ~ '^/seed/cars/[0-9]{2}-[0-9]\.webp$') THEN
      RAISE EXCEPTION 'invalid_images' USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_check_images ON public.listings;
CREATE TRIGGER listings_check_images
  BEFORE INSERT OR UPDATE OF images, user_id ON public.listings
  FOR EACH ROW EXECUTE FUNCTION private.check_listing_images();

-- ── inspection_reports.images (migration 011) ─────────
CREATE OR REPLACE FUNCTION private.check_inspection_images()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_url text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  FOREACH v_url IN ARRAY NEW.images LOOP
    IF NOT private.is_own_storage_url(v_url, 'inspector-media', NEW.inspector_id) THEN
      RAISE EXCEPTION 'invalid_images' USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inspection_reports_check_images ON public.inspection_reports;
CREATE TRIGGER inspection_reports_check_images
  BEFORE INSERT OR UPDATE OF images, inspector_id ON public.inspection_reports
  FOR EACH ROW EXECUTE FUNCTION private.check_inspection_images();

-- ── profiles.cover_url (migration 009) ────────────────
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_cover_url_own;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_cover_url_own
  CHECK (cover_url IS NULL OR private.is_own_storage_url(cover_url, 'car-images', id, 'profile/'))
  NOT VALID;

-- Nobody calls these directly; the triggers / constraint run them as the table owner
REVOKE ALL ON FUNCTION private.is_own_storage_url(text, text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.check_listing_images() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.check_inspection_images() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_own_storage_url(text, text, uuid, text) TO anon, authenticated;
