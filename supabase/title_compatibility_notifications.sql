-- Run this once in the Supabase Studio SQL Editor (project yynlzhfibeozrwrtrjbs),
-- after reengagement_notifications.sql (reuses its Vault secret + extensions).
--
-- Scope of this v1: the "taste profile" used for matching is built only
-- from genre_selected events (has a real numeric TMDB genre_id in its
-- metadata already). Mood-based and watch-history-based profiling can be
-- layered on later — for now a user needs to have picked "Por Gênero" at
-- least once to ever match.

-- Tracks which (user, title) pairs already got a compatibility push, so a
-- title trending for several days in a row doesn't re-notify daily. Never
-- touched by the client — RLS enabled with zero policies means only the
-- service role (which bypasses RLS) can read/write it at all.
create table public.title_compatibility_notified (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  tmdb_id int not null,
  media_type text not null,
  created_at timestamptz not null default now(),
  unique (user_id, tmdb_id)
);

create index title_compatibility_notified_user_id_idx on public.title_compatibility_notified (user_id);
alter table public.title_compatibility_notified enable row level security;

-- Given a trending title's TMDB genre_ids, scores every user who has a
-- device token and at least one genre_selected event: score = % of that
-- user's total genre picks that fall within this title's genres. E.g. a
-- user who picked "Ficção Científica" 3x and "Mistério" 1x out of 4 total
-- picks scores 100 against a Sci-Fi/Mystery title, 75 against a
-- Sci-Fi-only title.
create or replace function public.get_title_compatibility(candidate_genre_ids int[])
returns table (user_id uuid, score int)
language sql
stable
set search_path = public
as $$
  with user_genre_weights as (
    select
      ue.user_id,
      (ue.metadata->>'genreId')::int as genre_id,
      count(*) as weight
    from user_events ue
    where ue.event_type = 'genre_selected'
      and ue.metadata->>'genreId' is not null
    group by ue.user_id, genre_id
  ),
  user_totals as (
    select user_id, sum(weight) as total_weight
    from user_genre_weights
    group by user_id
  ),
  matched as (
    select ugw.user_id, sum(ugw.weight) as matched_weight
    from user_genre_weights ugw
    where ugw.genre_id = any(candidate_genre_ids)
    group by ugw.user_id
  ),
  has_token as (
    select distinct dpt.user_id from device_push_tokens dpt
  )
  select
    ut.user_id,
    round(100.0 * coalesce(m.matched_weight, 0) / ut.total_weight)::int as score
  from user_totals ut
  join has_token ht on ht.user_id = ut.user_id
  left join matched m on m.user_id = ut.user_id
  where ut.total_weight > 0;
$$;

revoke execute on function public.get_title_compatibility(int[]) from public, anon, authenticated;
grant execute on function public.get_title_compatibility(int[]) to service_role;

-- Daily at 21:00 UTC (18:00 Brasília) — before the reengagement job, so a
-- user who's a compatibility match isn't also independently pinged for
-- inactivity an hour later.
select cron.schedule(
  'title-compatibility-notifications',
  '0 21 * * *',
  $$
  select net.http_post(
    url := 'https://yynlzhfibeozrwrtrjbs.supabase.co/functions/v1/send-title-compatibility',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
