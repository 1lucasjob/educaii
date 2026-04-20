CREATE OR REPLACE FUNCTION public.plan_duration(_plan access_plan)
 RETURNS interval
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE _plan
    WHEN 'free' THEN interval '30 days'
    WHEN 'days_30' THEN interval '30 days'
    WHEN 'days_60' THEN interval '60 days'
    WHEN 'days_90' THEN interval '90 days'
    WHEN 'premium' THEN interval '366 days'
  END
$function$;