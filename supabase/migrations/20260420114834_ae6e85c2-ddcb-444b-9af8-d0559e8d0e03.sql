CREATE OR REPLACE FUNCTION public.plan_duration(_plan public.access_plan)
RETURNS interval
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _plan
    WHEN 'free' THEN interval '30 days'
    WHEN 'days_30' THEN interval '30 days'
    WHEN 'days_90' THEN interval '90 days'
    WHEN 'premium' THEN interval '366 days'
  END
$$;