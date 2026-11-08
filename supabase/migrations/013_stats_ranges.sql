-- =====================================================
-- rod2buy — Seller stats by date range + per listing
-- Run once in Supabase SQL Editor (after 012_listing_stats.sql)
-- Safe to re-run.
--
-- Same data as 012, but the caller picks the window (from–to, Bangkok dates,
-- inclusive, max 366 days) and can narrow the daily series to one listing.
-- The 012 functions stay so an older deploy keeps working.
-- =====================================================

-- ── 1. per-listing totals for a date range ───────────
CREATE OR REPLACE FUNCTION public.my_listing_stats_range(p_from date, p_to date)
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
  WITH win AS (
    SELECT p_from AS f, least(p_to, p_from + 365) AS t
  )
  SELECT
    l.id,
    coalesce((SELECT sum(v.views) FROM public.listing_view_days v, win
              WHERE v.listing_id = l.id AND v.day BETWEEN win.f AND win.t), 0)::integer,
    coalesce((SELECT sum(v.views) FROM public.listing_view_days v
              WHERE v.listing_id = l.id), 0)::integer,
    (SELECT count(*) FROM public.response_logs r, win
      WHERE r.listing_id = l.id AND r.buyer_id <> l.user_id
        AND (r.contacted_at AT TIME ZONE 'Asia/Bangkok')::date BETWEEN win.f AND win.t)::integer,
    (SELECT count(*) FROM public.response_logs r
      WHERE r.listing_id = l.id AND r.buyer_id <> l.user_id)::integer,
    (SELECT count(*) FROM public.saved_listings s WHERE s.listing_id = l.id)::integer
  FROM public.listings l
  WHERE l.user_id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.my_listing_stats_range(date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_listing_stats_range(date, date) TO authenticated;

-- ── 2. daily series for a date range, all or one listing ──
-- p_listing_id NULL = all of the caller's listings. Someone else's listing
-- id simply matches nothing (the "mine" filter), so it returns zeros.
CREATE OR REPLACE FUNCTION public.my_stats_daily_range(
  p_from date,
  p_to date,
  p_listing_id uuid DEFAULT NULL
)
RETURNS TABLE (day date, views integer, contacts integer)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH days AS (
    SELECT generate_series(p_from, least(p_to, p_from + 365), interval '1 day')::date AS day
  ),
  mine AS (
    SELECT id, user_id FROM public.listings
    WHERE user_id = auth.uid()
      AND (p_listing_id IS NULL OR id = p_listing_id)
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

REVOKE EXECUTE ON FUNCTION public.my_stats_daily_range(date, date, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_stats_daily_range(date, date, uuid) TO authenticated;
