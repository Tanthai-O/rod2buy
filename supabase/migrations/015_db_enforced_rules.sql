-- =====================================================
-- rod2buy — Rules that lived only in the web app, now enforced in the DB
-- Run once in Supabase SQL Editor (after 014_image_url_checks.sql)
-- Safe to re-run.
--
-- RLS lets owners write their own rows straight through the REST API, so a
-- rule checked only in a server action can be skipped. This moves four of them:
-- 1. Editing a live listing (anything but price) sends it back to moderation
-- 2. Reserved shop names (admin, rod2buy, official, …) can't be taken
-- 3. Editing an inspection report the car's owner already accepted needs a
--    new confirmation
-- 4. View counts: at most 3 per network address per listing per day
-- The SQL Editor / service role (auth.uid() IS NULL) and admins are not restricted.
-- =====================================================

-- ── 1. listings: edits to a live listing need review ──
-- Same rule as updateListing() in app/sell/actions.ts (NO_REVIEW_FIELDS = price).
-- Runs after listings_derive_doc_flags (trigger name order), so the document
-- flags compared here are already the real ones.
CREATE OR REPLACE FUNCTION public.guard_listing_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- columns an owner may change on a live listing without a new review
  c_free constant text[] := ARRAY['status', 'rejection_reason', 'price', 'updated_at'];
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status           := 'pending';
    NEW.rejection_reason := NULL;
    RETURN NEW;
  END IF;

  -- Never the owner's to change (created_at would bump the "newest" sort)
  NEW.id         := OLD.id;
  NEW.user_id    := OLD.user_id;
  NEW.created_at := OLD.created_at;

  -- Owner may: resubmit (→ pending) or mark sold (active → sold)
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT (NEW.status = 'pending')
     AND NOT (OLD.status = 'active' AND NEW.status = 'sold') THEN
    NEW.status := OLD.status;
  END IF;

  -- Owner may clear a rejection reason (on resubmit) but never write one
  IF NEW.rejection_reason IS NOT NULL
     AND NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
    NEW.rejection_reason := OLD.rejection_reason;
  END IF;

  -- A live listing whose content changed goes back to the moderation queue
  IF OLD.status = 'active'
     AND (to_jsonb(NEW) - c_free) IS DISTINCT FROM (to_jsonb(OLD) - c_free) THEN
    NEW.status           := 'pending';
    NEW.rejection_reason := NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- ── 2. reserved shop names ────────────────────────────
-- Keep in sync with RESERVED_USERNAMES in lib/seller.ts
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_reserved;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_reserved
  CHECK (username IS NULL OR username NOT IN (
    'admin', 'administrator', 'rod2buy', 'support', 'help', 'official', 'staff', 'team', 'system',
    'listings', 'sell', 'sellers', 'swipe', 'compare', 'dashboard', 'login', 'register', 'about',
    'privacy', 'terms', 'safety', 'account', 'mfa', 'api', 'auth', 'seed', 'inspectors'
  ))
  NOT VALID;

-- ── 3. inspection reports: accepted content can't be swapped ─
-- Same function as migration 011 + the last block.
CREATE OR REPLACE FUNCTION public.guard_inspection_report()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_owner uuid;
  -- everything except these is the report's content
  c_meta constant text[] := ARRAY['id', 'inspector_id', 'listing_id', 'listing_confirmed', 'created_at'];
BEGIN
  IF NEW.listing_id IS NOT NULL THEN
    SELECT user_id INTO v_listing_owner FROM public.listings WHERE id = NEW.listing_id;
    IF v_listing_owner = NEW.inspector_id THEN
      RAISE EXCEPTION 'cannot_inspect_own_listing';
    END IF;
  END IF;

  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF (SELECT count(*) FROM public.inspection_reports
        WHERE inspector_id = NEW.inspector_id AND created_at > now() - interval '24 hours') >= 20 THEN
      RAISE EXCEPTION 'rate_limited';
    END IF;
    NEW.listing_confirmed := NULL;
    RETURN NEW;
  END IF;

  NEW.inspector_id := OLD.inspector_id;
  NEW.created_at   := OLD.created_at;

  IF NEW.listing_id IS DISTINCT FROM OLD.listing_id THEN
    NEW.listing_confirmed := NULL;
  ELSIF NEW.listing_confirmed IS DISTINCT FROM OLD.listing_confirmed
        AND auth.uid() IS DISTINCT FROM v_listing_owner THEN
    NEW.listing_confirmed := OLD.listing_confirmed;
  END IF;

  -- The car's owner accepted a specific report: if its content changes
  -- (verdict, summary, checklist, photos, …) they have to accept it again
  IF OLD.listing_confirmed IS TRUE AND NEW.listing_confirmed IS TRUE
     AND (to_jsonb(NEW) - c_meta) IS DISTINCT FROM (to_jsonb(OLD) - c_meta) THEN
    NEW.listing_confirmed := NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- ── 4. view counts: cap per network address ───────────
-- record_listing_view() is callable without login, so a loop could inflate a
-- listing's views. Count at most 3 views per address per listing per day
-- (3, not 1: mobile carriers put many people behind one address).
-- No address is stored: only a hash salted with a random value that is deleted
-- after two days, so the hash can't be turned back into an address (PDPA).
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.view_salts (
  day  date PRIMARY KEY,
  salt bytea NOT NULL
);

CREATE TABLE IF NOT EXISTS private.view_dedupe (
  day date NOT NULL,
  key bytea NOT NULL,
  n   smallint NOT NULL DEFAULT 1,
  PRIMARY KEY (day, key)
);

REVOKE ALL ON private.view_salts, private.view_dedupe FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_listing_view(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner   uuid;
  v_day     date := (now() AT TIME ZONE 'Asia/Bangkok')::date;
  v_headers json := nullif(current_setting('request.headers', true), '')::json;
  v_addr    text;
  v_salt    bytea;
  v_n       smallint;
BEGIN
  SELECT user_id INTO v_owner
  FROM public.listings
  WHERE id = p_listing_id AND status = 'active';

  IF v_owner IS NULL OR v_owner = auth.uid() THEN
    RETURN;
  END IF;

  -- cf-connecting-ip is set by the gateway; x-forwarded-for is the fallback
  v_addr := coalesce(
    nullif(trim(v_headers ->> 'cf-connecting-ip'), ''),
    nullif(trim(split_part(v_headers ->> 'x-forwarded-for', ',', 1)), '')
  );

  -- No address available (not expected through the API): count as before
  IF v_addr IS NOT NULL THEN
    SELECT salt INTO v_salt FROM private.view_salts WHERE day = v_day;
    IF v_salt IS NULL THEN
      -- first view of the day: new salt, forget everything older than yesterday
      DELETE FROM private.view_dedupe WHERE day < v_day - 1;
      DELETE FROM private.view_salts  WHERE day < v_day - 1;
      INSERT INTO private.view_salts (day, salt)
      VALUES (v_day, uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid()))
      ON CONFLICT (day) DO NOTHING;
      SELECT salt INTO v_salt FROM private.view_salts WHERE day = v_day;
    END IF;

    INSERT INTO private.view_dedupe AS d (day, key)
    VALUES (v_day, sha256(v_salt || convert_to(v_addr || '|' || p_listing_id::text, 'UTF8')))
    ON CONFLICT (day, key) DO UPDATE SET n = least(d.n + 1, 1000)
    RETURNING n INTO v_n;

    IF v_n > 3 THEN
      RETURN;
    END IF;
  END IF;

  INSERT INTO public.listing_view_days AS d (listing_id, day, views)
  VALUES (p_listing_id, v_day, 1)
  ON CONFLICT (listing_id, day) DO UPDATE SET views = d.views + 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_listing_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_listing_view(uuid) TO anon, authenticated;
