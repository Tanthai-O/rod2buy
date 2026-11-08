-- =====================================================
-- rod2buy — Inspector profiles (คนดูรถ / ช่างตรวจรถมือสอง)
-- Run once in Supabase SQL Editor (after 010_verification_selfie.sql)
-- Safe to re-run.
--
-- inspector_profiles  = one per user, admin approves before it's public;
--                       only ID-verified users can apply
-- inspection_reports  = portfolio: structured checklist + photos, may link to a
--                       listing (shown on that listing once its owner accepts)
-- inspector_contacts  = log of who revealed an inspector's phone / LINE
-- inspector_reviews   = only from people who contacted the inspector
-- inspector_scores    = view: rating + report count for approved inspectors
-- =====================================================

-- ── 1. inspector_profiles ────────────────────────────
CREATE TABLE IF NOT EXISTS public.inspector_profiles (
  user_id          uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  headline         text NOT NULL,
  bio              text,
  years_experience smallint NOT NULL DEFAULT 0,
  provinces        text[] NOT NULL DEFAULT '{}',
  specialties      text[] NOT NULL DEFAULT '{}',
  brands           text[] NOT NULL DEFAULT '{}',
  service_modes    text[] NOT NULL DEFAULT '{on_site}',
  price_from       integer,
  price_to         integer,
  price_note       text,
  status           text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT inspector_headline_len   CHECK (char_length(headline) BETWEEN 5 AND 120),
  CONSTRAINT inspector_bio_len        CHECK (bio IS NULL OR char_length(bio) <= 3000),
  CONSTRAINT inspector_years          CHECK (years_experience BETWEEN 0 AND 60),
  CONSTRAINT inspector_provinces      CHECK (cardinality(provinces) BETWEEN 1 AND 10),
  CONSTRAINT inspector_brands         CHECK (cardinality(brands) <= 20),
  CONSTRAINT inspector_specialties    CHECK (
    cardinality(specialties) <= 15
    AND specialties <@ ARRAY[
      'eco_car', 'sedan', 'pickup', 'suv', 'european', 'luxury', 'ev_hybrid', 'modified',
      'classic', 'flood', 'accident', 'engine', 'electrical', 'paint', 'documents'
    ]::text[]
  ),
  CONSTRAINT inspector_service_modes  CHECK (
    cardinality(service_modes) >= 1
    AND service_modes <@ ARRAY['on_site', 'at_shop', 'video_call']::text[]
  ),
  CONSTRAINT inspector_price_range    CHECK (
    (price_from IS NULL OR price_from BETWEEN 0 AND 100000)
    AND (price_to IS NULL OR price_to BETWEEN 0 AND 100000)
    AND (price_from IS NULL OR price_to IS NULL OR price_to >= price_from)
  ),
  CONSTRAINT inspector_price_note_len CHECK (price_note IS NULL OR char_length(price_note) <= 200),
  CONSTRAINT inspector_status         CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'))
);

-- Directory filters by province / specialty
CREATE INDEX IF NOT EXISTS inspector_profiles_provinces_idx
  ON public.inspector_profiles USING gin (provinces) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS inspector_profiles_specialties_idx
  ON public.inspector_profiles USING gin (specialties) WHERE status = 'approved';

-- Owners can't approve themselves. Same shape as guard_listing_status (002).
CREATE OR REPLACE FUNCTION public.guard_inspector_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();

  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND id_verified) THEN
      RAISE EXCEPTION 'id_verification_required';
    END IF;
    NEW.status           := 'pending';
    NEW.rejection_reason := NULL;
    RETURN NEW;
  END IF;

  NEW.user_id    := OLD.user_id;
  NEW.created_at := OLD.created_at;

  -- Owner may only resubmit after a rejection (rejected → pending)
  IF OLD.status = 'rejected' AND NEW.status = 'pending' THEN
    NEW.rejection_reason := NULL;
  ELSE
    NEW.status           := OLD.status;
    NEW.rejection_reason := OLD.rejection_reason;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inspector_profiles_guard ON public.inspector_profiles;
CREATE TRIGGER inspector_profiles_guard
  BEFORE INSERT OR UPDATE ON public.inspector_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_inspector_profile();

ALTER TABLE public.inspector_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_inspector_profiles" ON public.inspector_profiles;
CREATE POLICY "read_inspector_profiles" ON public.inspector_profiles
  FOR SELECT
  USING (status = 'approved' OR user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "owner_insert_inspector_profile" ON public.inspector_profiles;
CREATE POLICY "owner_insert_inspector_profile" ON public.inspector_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "owner_admin_update_inspector_profile" ON public.inspector_profiles;
CREATE POLICY "owner_admin_update_inspector_profile" ON public.inspector_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "owner_admin_delete_inspector_profile" ON public.inspector_profiles;
CREATE POLICY "owner_admin_delete_inspector_profile" ON public.inspector_profiles
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- ── 2. inspection_reports (portfolio) ────────────────
CREATE TABLE IF NOT EXISTS public.inspection_reports (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspector_id      uuid NOT NULL REFERENCES public.inspector_profiles(user_id) ON DELETE CASCADE,
  listing_id        uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  -- NULL = waiting for the listing owner, true = shown on the listing, false = declined
  listing_confirmed boolean,
  brand             text NOT NULL,
  model             text NOT NULL,
  year              smallint NOT NULL,
  province          text,
  inspected_at      date NOT NULL DEFAULT current_date,
  verdict           text NOT NULL,
  summary           text NOT NULL,
  checklist         jsonb NOT NULL DEFAULT '[]',
  images            text[] NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT inspection_brand_len   CHECK (char_length(brand) BETWEEN 1 AND 50),
  CONSTRAINT inspection_model_len   CHECK (char_length(model) BETWEEN 1 AND 100),
  CONSTRAINT inspection_year        CHECK (year BETWEEN 1950 AND 2100),
  CONSTRAINT inspection_date        CHECK (inspected_at <= current_date),
  CONSTRAINT inspection_verdict     CHECK (verdict IN ('recommend', 'caution', 'not_recommend')),
  CONSTRAINT inspection_summary_len CHECK (char_length(summary) BETWEEN 10 AND 3000),
  CONSTRAINT inspection_checklist   CHECK (jsonb_typeof(checklist) = 'array' AND jsonb_array_length(checklist) <= 30),
  CONSTRAINT inspection_images      CHECK (cardinality(images) <= 12)
);

CREATE INDEX IF NOT EXISTS inspection_reports_inspector_idx
  ON public.inspection_reports (inspector_id, inspected_at DESC);
CREATE INDEX IF NOT EXISTS inspection_reports_listing_idx
  ON public.inspection_reports (listing_id) WHERE listing_id IS NOT NULL;

-- Only the listing owner decides whether a report shows on their listing
-- (via confirm_inspection_report below). Inspectors can't inspect their own
-- listing for a badge, and get 20 new reports per day.
CREATE OR REPLACE FUNCTION public.guard_inspection_report()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_owner uuid;
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

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inspection_reports_guard ON public.inspection_reports;
CREATE TRIGGER inspection_reports_guard
  BEFORE INSERT OR UPDATE ON public.inspection_reports
  FOR EACH ROW EXECUTE FUNCTION public.guard_inspection_report();

ALTER TABLE public.inspection_reports ENABLE ROW LEVEL SECURITY;

-- Readable whenever the inspector profile is readable (approved → everyone,
-- pending → the inspector + admin, who reviews the portfolio before approving)
DROP POLICY IF EXISTS "read_with_inspector" ON public.inspection_reports;
CREATE POLICY "read_with_inspector" ON public.inspection_reports
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.inspector_profiles WHERE user_id = inspector_id));

-- Pending inspectors may add reports too; suspended ones may not
DROP POLICY IF EXISTS "inspector_insert_reports" ON public.inspection_reports;
CREATE POLICY "inspector_insert_reports" ON public.inspection_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    inspector_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.inspector_profiles
      WHERE user_id = auth.uid() AND status IN ('pending', 'approved')
    )
  );

DROP POLICY IF EXISTS "inspector_update_reports" ON public.inspection_reports;
CREATE POLICY "inspector_update_reports" ON public.inspection_reports
  FOR UPDATE TO authenticated
  USING (inspector_id = auth.uid())
  WITH CHECK (inspector_id = auth.uid());

DROP POLICY IF EXISTS "inspector_admin_delete_reports" ON public.inspection_reports;
CREATE POLICY "inspector_admin_delete_reports" ON public.inspection_reports
  FOR DELETE TO authenticated
  USING (inspector_id = auth.uid() OR public.is_admin());

-- Listing owner accepts (true) or declines (false) a report linked to their listing
CREATE OR REPLACE FUNCTION public.confirm_inspection_report(p_report_id uuid, p_accept boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'login_required';
  END IF;

  UPDATE public.inspection_reports r
  SET listing_confirmed = p_accept
  FROM public.listings l
  WHERE r.id = p_report_id
    AND l.id = r.listing_id
    AND l.user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirm_inspection_report(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_inspection_report(uuid, boolean) TO authenticated;

-- ── 3. inspector_contacts + reveal RPC ───────────────
CREATE TABLE IF NOT EXISTS public.inspector_contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspector_id uuid NOT NULL REFERENCES public.inspector_profiles(user_id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contacted_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS inspector_contacts_pair
  ON public.inspector_contacts (inspector_id, user_id);
CREATE INDEX IF NOT EXISTS inspector_contacts_user_time
  ON public.inspector_contacts (user_id, contacted_at DESC);

ALTER TABLE public.inspector_contacts ENABLE ROW LEVEL SECURITY;

-- No INSERT policy: rows are written only by reveal_inspector_contact()
DROP POLICY IF EXISTS "party_read_inspector_contacts" ON public.inspector_contacts;
CREATE POLICY "party_read_inspector_contacts" ON public.inspector_contacts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR inspector_id = auth.uid());

-- Same idea as reveal_contact() (003): logs the contact, 20 new inspectors per 24h
CREATE OR REPLACE FUNCTION public.reveal_inspector_contact(p_inspector_id uuid)
RETURNS TABLE (phone text, line_id text)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid    uuid := auth.uid();
  v_recent integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'login_required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.inspector_profiles
    WHERE user_id = p_inspector_id
      AND (status = 'approved' OR user_id = v_uid OR public.is_admin())
  ) THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  IF p_inspector_id <> v_uid AND NOT EXISTS (
    SELECT 1 FROM public.inspector_contacts
    WHERE inspector_id = p_inspector_id AND user_id = v_uid
  ) THEN
    SELECT count(*) INTO v_recent
    FROM public.inspector_contacts
    WHERE user_id = v_uid AND contacted_at > now() - interval '24 hours';

    IF v_recent >= 20 THEN
      RAISE EXCEPTION 'rate_limited';
    END IF;

    INSERT INTO public.inspector_contacts (inspector_id, user_id) VALUES (p_inspector_id, v_uid);
  END IF;

  RETURN QUERY
  SELECT p.phone::text, p.line_id::text FROM public.profiles p WHERE p.id = p_inspector_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reveal_inspector_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reveal_inspector_contact(uuid) TO authenticated;

-- ── 4. inspector_reviews ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.inspector_reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspector_id uuid NOT NULL REFERENCES public.inspector_profiles(user_id) ON DELETE CASCADE,
  reviewer_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating       smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      text CHECK (comment IS NULL OR char_length(comment) <= 1000),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS inspector_reviews_one_per_pair
  ON public.inspector_reviews (inspector_id, reviewer_id);

ALTER TABLE public.inspector_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_inspector_reviews" ON public.inspector_reviews;
CREATE POLICY "public_read_inspector_reviews" ON public.inspector_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "contacted_insert_inspector_reviews" ON public.inspector_reviews;
CREATE POLICY "contacted_insert_inspector_reviews" ON public.inspector_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND inspector_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.inspector_contacts c
      WHERE c.user_id = auth.uid() AND c.inspector_id = inspector_reviews.inspector_id
    )
  );

DROP POLICY IF EXISTS "reviewer_admin_delete_inspector_reviews" ON public.inspector_reviews;
CREATE POLICY "reviewer_admin_delete_inspector_reviews" ON public.inspector_reviews
  FOR DELETE TO authenticated
  USING (reviewer_id = auth.uid() OR public.is_admin());

-- ── 5. inspector_scores view ─────────────────────────
-- security_invoker: everything it counts is already public under RLS (reviews,
-- reports of approved inspectors), so it needs no definer rights — keeps the
-- Supabase Security Advisor quiet (see 009_shop_profiles)
DROP VIEW IF EXISTS public.inspector_scores;
CREATE VIEW public.inspector_scores WITH (security_invoker = true) AS
SELECT
  i.user_id,
  (SELECT round(avg(r.rating)::numeric, 2)::float8
     FROM public.inspector_reviews r WHERE r.inspector_id = i.user_id) AS avg_rating,
  (SELECT count(*)::integer
     FROM public.inspector_reviews r WHERE r.inspector_id = i.user_id) AS review_count,
  (SELECT count(*)::integer
     FROM public.inspection_reports x WHERE x.inspector_id = i.user_id) AS report_count
FROM public.inspector_profiles i
WHERE i.status = 'approved';

GRANT SELECT ON public.inspector_scores TO anon, authenticated;

-- ── 6. storage: inspector-media (public report photos) ─
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inspector-media',
  'inspector-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- path: {user_id}/reports/...
DROP POLICY IF EXISTS "owner_upload_inspector_media" ON storage.objects;
CREATE POLICY "owner_upload_inspector_media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'inspector-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "owner_admin_delete_inspector_media" ON storage.objects;
CREATE POLICY "owner_admin_delete_inspector_media" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'inspector-media'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );
