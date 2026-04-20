-- Add opt-in flag (default true) to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_in_ranking boolean NOT NULL DEFAULT true;

-- RPC that returns the public leaderboard for authenticated users.
-- Only includes profiles where show_in_ranking = true, exposes display_name (part before @),
-- and aggregates: total_score, hard_passed (>=80), avg_score, attempts.
-- Composite score = hard_passed * 10 * 10 + avg_score (hard_passed weighted heavily).
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  total_score bigint,
  hard_passed bigint,
  attempts bigint,
  avg_score numeric,
  composite_score numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS user_id,
    split_part(p.email, '@', 1) AS display_name,
    COALESCE(SUM(qa.score), 0)::bigint AS total_score,
    COALESCE(SUM(CASE WHEN qa.difficulty = 'hard' AND qa.score >= 80 THEN 1 ELSE 0 END), 0)::bigint AS hard_passed,
    COUNT(qa.id)::bigint AS attempts,
    COALESCE(ROUND(AVG(qa.score)::numeric, 1), 0) AS avg_score,
    (
      COALESCE(SUM(CASE WHEN qa.difficulty = 'hard' AND qa.score >= 80 THEN 1 ELSE 0 END), 0) * 10
      + COALESCE(AVG(qa.score), 0)
    )::numeric AS composite_score
  FROM public.profiles p
  LEFT JOIN public.quiz_attempts qa ON qa.user_id = p.id
  WHERE p.show_in_ranking = true
    AND auth.uid() IS NOT NULL
  GROUP BY p.id, p.email
  HAVING COUNT(qa.id) > 0
  ORDER BY composite_score DESC, total_score DESC
  LIMIT 100;
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;