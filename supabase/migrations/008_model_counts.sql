-- =====================================================
-- rod2buy — Brand / model counts for the filter dropdowns
-- ("Toyota (12)" → "Yaris Ativ (3)", like other marketplaces)
-- Run once in Supabase SQL Editor (after 007_modifications.sql)
-- Safe to re-run.
-- =====================================================

-- security_invoker: the view runs with the caller's rights, so listings RLS
-- still applies (it also filters status = 'active' explicitly).
CREATE OR REPLACE VIEW public.listing_model_counts
WITH (security_invoker = true) AS
SELECT brand, model, count(*)::integer AS listing_count
FROM public.listings
WHERE status = 'active'
GROUP BY brand, model;

GRANT SELECT ON public.listing_model_counts TO anon, authenticated;

-- ── normalise model names to the catalog in lib/car-models.ts ─
-- Older listings were typed by hand; align the common variants so they group together.
UPDATE public.listings SET model = '2', title = concat_ws(' ', brand, '2', variant, year)
  WHERE brand = 'Mazda' AND lower(replace(model, ' ', '')) IN ('mazda2', '2');
UPDATE public.listings SET model = '3', title = concat_ws(' ', brand, '3', variant, year)
  WHERE brand = 'Mazda' AND lower(replace(model, ' ', '')) IN ('mazda3', '3');
UPDATE public.listings SET model = 'Yaris Ativ', title = concat_ws(' ', brand, 'Yaris Ativ', variant, year)
  WHERE brand = 'Toyota' AND lower(trim(model)) IN ('ativ', 'yaris ativ');
