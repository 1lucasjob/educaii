-- Add renewal counter for days_30 plan
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS days_30_renewals_count integer NOT NULL DEFAULT 0;

-- Update admin_renew_user to increment counter on days_30 renewals
CREATE OR REPLACE FUNCTION public.admin_renew_user(_user_id uuid, _plan access_plan)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas admin pode renovar acesso';
  END IF;
  UPDATE public.profiles
  SET plan = _plan,
      access_expires_at = now() + public.plan_duration(_plan),
      chat_unlocked = CASE WHEN _plan = 'free' THEN chat_unlocked ELSE true END,
      days_30_renewals_count = CASE
        WHEN _plan = 'days_30' THEN days_30_renewals_count + 1
        ELSE days_30_renewals_count
      END
  WHERE id = _user_id;
END;
$function$;