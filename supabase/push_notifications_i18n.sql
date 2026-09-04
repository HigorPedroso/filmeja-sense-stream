-- Run this once in the Supabase Studio SQL Editor (project yynlzhfibeozrwrtrjbs),
-- after reengagement_notifications.sql, weekend_session_notifications.sql and
-- title_compatibility_notifications.sql.
--
-- Adds a language column to profiles (kept in sync from the client by
-- useSyncProfileLanguage) and threads it through the three candidate RPCs
-- used by the push-notification cron jobs, so the Edge Functions — which
-- run in Deno with no access to the client's i18next state — know which
-- language to send each user's notification in.

alter table public.profiles
  add column if not exists language text not null default 'pt-BR';

alter table public.profiles drop constraint if exists profiles_language_check;
alter table public.profiles
  add constraint profiles_language_check check (language in ('pt-BR', 'en-US'));

-- create or replace can't change a function's OUT-parameter row type (we're
-- adding the "language" column here), so the old signature has to go first.
drop function if exists public.get_reengagement_candidates(int, int);

create function public.get_reengagement_candidates(
  inactive_days int default 3,
  cooldown_days int default 3
)
returns table (user_id uuid, top_choice text, language text)
language sql
stable
set search_path = public
as $$
  with last_active as (
    select ue.user_id, max(ue.created_at) as last_opened
    from user_events ue
    where ue.event_type = 'app_opened'
    group by ue.user_id
  ),
  recently_notified as (
    select distinct ue.user_id
    from user_events ue
    where ue.event_type = 'notification_sent'
      and ue.created_at > now() - (cooldown_days || ' days')::interval
  ),
  has_token as (
    select distinct dpt.user_id from device_push_tokens dpt
  ),
  preference_counts as (
    select
      ue.user_id,
      coalesce(ue.metadata->>'moodName', ue.metadata->>'genreName') as choice,
      count(*) as choice_count
    from user_events ue
    where ue.event_type in ('mood_selected', 'genre_selected')
      and coalesce(ue.metadata->>'moodName', ue.metadata->>'genreName') is not null
    group by ue.user_id, choice
  ),
  top_preference as (
    select distinct on (pc.user_id) pc.user_id, pc.choice
    from preference_counts pc
    order by pc.user_id, pc.choice_count desc
  )
  select la.user_id, tp.choice as top_choice, coalesce(p.language, 'pt-BR') as language
  from last_active la
  join has_token ht on ht.user_id = la.user_id
  left join recently_notified rn on rn.user_id = la.user_id
  left join top_preference tp on tp.user_id = la.user_id
  left join public.profiles p on p.id = la.user_id
  where la.last_opened < now() - (inactive_days || ' days')::interval
    and rn.user_id is null;
$$;

revoke execute on function public.get_reengagement_candidates(int, int) from public, anon, authenticated;
grant execute on function public.get_reengagement_candidates(int, int) to service_role;

drop function if exists public.get_weekend_session_candidates();

create function public.get_weekend_session_candidates()
returns table (user_id uuid, top_choice text, language text)
language sql
stable
set search_path = public
as $$
  with has_token as (
    select distinct dpt.user_id from device_push_tokens dpt
  ),
  preference_counts as (
    select
      ue.user_id,
      coalesce(ue.metadata->>'moodName', ue.metadata->>'genreName') as choice,
      count(*) as choice_count
    from user_events ue
    where ue.event_type in ('mood_selected', 'genre_selected')
      and coalesce(ue.metadata->>'moodName', ue.metadata->>'genreName') is not null
    group by ue.user_id, choice
  ),
  top_preference as (
    select distinct on (pc.user_id) pc.user_id, pc.choice
    from preference_counts pc
    order by pc.user_id, pc.choice_count desc
  )
  select ht.user_id, tp.choice as top_choice, coalesce(p.language, 'pt-BR') as language
  from has_token ht
  left join top_preference tp on tp.user_id = ht.user_id
  left join public.profiles p on p.id = ht.user_id;
$$;

revoke execute on function public.get_weekend_session_candidates() from public, anon, authenticated;
grant execute on function public.get_weekend_session_candidates() to service_role;

drop function if exists public.get_title_compatibility(int[]);

create function public.get_title_compatibility(candidate_genre_ids int[])
returns table (user_id uuid, score int, language text)
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
    round(100.0 * coalesce(m.matched_weight, 0) / ut.total_weight)::int as score,
    coalesce(p.language, 'pt-BR') as language
  from user_totals ut
  join has_token ht on ht.user_id = ut.user_id
  left join matched m on m.user_id = ut.user_id
  left join public.profiles p on p.id = ut.user_id
  where ut.total_weight > 0;
$$;

revoke execute on function public.get_title_compatibility(int[]) from public, anon, authenticated;
grant execute on function public.get_title_compatibility(int[]) to service_role;
