DROP FUNCTION IF EXISTS public.get_leaderboard();

CREATE OR REPLACE FUNCTION public.get_leaderboard()
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, created_at timestamptz, total_score bigint, hard_passed bigint, attempts bigint, avg_score numeric, composite_score numeric, attempts_data jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH ranked_attempts AS (
    SELECT
      qa.*,
      ROW_NUMBER() OVER (
        PARTITION BY qa.user_id, lower(trim(qa.topic)), date_trunc('day', qa.created_at)
        ORDER BY qa.score DESC, qa.created_at ASC
      ) AS rn
    FROM public.quiz_attempts qa
    WHERE qa.counts_for_ranking = true
      AND qa.time_spent_seconds >= 120
  ),
  valid AS (
    SELECT * FROM ranked_attempts WHERE rn <= 3
  )
  SELECT
    p.id AS user_id,
    COALESCE(NULLIF(trim(p.display_name), ''), split_part(p.email, '@', 1)) AS display_name,
    p.avatar_url AS avatar_url,
    p.created_at AS created_at,
    COALESCE(SUM(v.score), 0)::bigint AS total_score,
    COALESCE(SUM(CASE WHEN v.difficulty = 'hard' AND v.score >= 80 THEN 1 ELSE 0 END), 0)::bigint AS hard_passed,
    COUNT(v.id)::bigint AS attempts,
    COALESCE(ROUND(AVG(v.score)::numeric, 1), 0) AS avg_score,
    (
      COALESCE(SUM(CASE WHEN v.difficulty = 'hard' AND v.score >= 80 THEN 1 ELSE 0 END), 0) * 10
      + COALESCE(AVG(v.score), 0)
    )::numeric AS composite_score,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'topic', v.topic,
          'difficulty', v.difficulty,
          'score', v.score,
          'created_at', v.created_at,
          'time_spent_seconds', v.time_spent_seconds
        )
      ) FILTER (WHERE v.id IS NOT NULL),
      '[]'::jsonb
    ) AS attempts_data
  FROM public.profiles p
  LEFT JOIN valid v ON v.user_id = p.id
  WHERE p.show_in_ranking = true
    AND p.plan <> 'free'
    AND auth.uid() IS NOT NULL
  GROUP BY p.id, p.email, p.display_name, p.avatar_url, p.created_at
  HAVING COUNT(v.id) > 0
  ORDER BY composite_score DESC, total_score DESC
  LIMIT 100;
$function$;