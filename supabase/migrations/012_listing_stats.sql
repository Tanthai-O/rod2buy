-- =====================================================
-- rod2buy — Seller stats (สถิติประกาศสำหรับผู้ขาย / เต็นท์)
-- Run once in Supabase SQL Editor (after 011_inspectors.sql)
-- Safe to re-run.
--
-- listing_view_days = view counter per listing per day (Bangkok time).
--                     No per-visitor rows: we only need totals, and it keeps
--                     no personal data (PDPA). Written only by record_listing_view().
-- my_listing_stats()   = per-listing views / contacts / saves for the caller
-- my_stats_daily()     = daily views / contacts across the caller's listings
-- Contacts come from response_logs (written by reveal_contact(), migration 003).
-- =====================================================

-- ── 1. daily view counter ────────────────────────────
CREATE TABLE IF NOT EXISTS public.listing_view_days (
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  day        date NOT NULL,
  views      integer NOT NULL DEFAULT 0,
  PRIMARY KEY (listing_id, day)
);

-- No policies: nobody reads or writes the table directly
ALTER TABLE public.listing_view_days ENABLE ROW LEVEL SECURITY;

-- Called by the listing page once per visitor per listing per day (the browser
-- remembers it). Owners viewing their own listing don't count. Counts are
-- approximate by design — the client can't be trusted to dedupe perfectly.
CREATE OR REPLACE FUNCTION public.record_listing_view(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner
  FROM public.listings
  WHERE id = p_listing_id AND status = 'active';

  IF v_owner IS NULL OR v_owner = auth.uid() THEN
    RETURN;
  END IF;

  INSERT INTO public.listing_view_days AS d (listing_id, day, views)
  VALUES (p_listing_id, (now() AT TIME ZONE 'Asia/Bangkok')::date, 1)
  ON CONFLICT (listing_id, day) DO UPDATE SET views = d.views + 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_listing_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_listing_view(uuid) TO anon, authenticated;

-- ── 2. per-listing stats for the signed-in seller ────
-- Aggregates only: the seller learns how many people saved or contacted,
-- never who (saved_listings is otherwise private to the saver).
CREATE OR REPLACE FUNCTION public.my_listing_stats(p_days integer DEFAULT 30)
RETURNS TABLE (
  listing_id     uuid,
  views          integer,
  views_total    integer,
  contacts       integer,
  contacts_total integer,
  saves          integer
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH since AS (
    SELECT ((now() AT TIME ZONE 'Asia/Bangkok')::date - (least(greatest(p_days, 1), 365) - 1)) AS d
  )
  SELECT
    l.id,
    coalesce((SELECT sum(v.views) FROM public.listing_view_days v, since
              WHERE v.listing_id = l.id AND v.day >= since.d), 0)::integer,
    coalesce((SELECT sum(v.views) FROM public.listing_view_days v
              WHERE v.listing_id = l.id), 0)::integer,
    (SELECT count(*) FROM public.response_logs r, since
      WHERE r.listing_id = l.id AND r.buyer_id <> l.user_id
        AND (r.contacted_at AT TIME ZONE 'Asia/Bangkok')::date >= since.d)::integer,
    (SELECT count(*) FROM public.response_logs r
      WHERE r.listing_id = l.id AND r.buyer_id <> l.user_id)::integer,
    (SELECT count(*) FROM public.saved_listings s WHERE s.listing_id = l.id)::integer
  FROM public.listings l
  WHERE l.user_id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.my_listing_stats(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_listing_stats(integer) TO authenticated;

-- ── 3. daily totals across the seller's listings ─────
CREATE OR REPLACE FUNCTION public.my_stats_daily(p_days integer DEFAULT 30)
RETURNS TABLE (day date, views integer, contacts integer)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH days AS (
    SELECT generate_series(
      (now() AT TIME ZONE 'Asia/Bangkok')::date - (least(greatest(p_days, 1), 365) - 1),
      (now() AT TIME ZONE 'Asia/Bangkok')::date,
      interval '1 day'
    )::date AS day
  ),
  mine AS (
    SELECT id, user_id FROM public.listings WHERE user_id = auth.uid()
  )
  SELECT
    days.day,
    coalesce((SELECT sum(v.views) FROM public.listing_view_days v JOIN mine ON mine.id = v.listing_id
              WHERE v.day = days.day), 0)::integer,
    (SELECT count(*) FROM public.response_logs r JOIN mine ON mine.id = r.listing_id
      WHERE r.buyer_id <> mine.user_id
        AND (r.contacted_at AT TIME ZONE 'Asia/Bangkok')::date = days.day)::integer
  FROM days
  ORDER BY days.day;
$$;

REVOKE EXECUTE ON FUNCTION public.my_stats_daily(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_stats_daily(integer) TO authenticated;
