-- Re-creates the two RPC functions that got rolled back when the earlier
-- scripts failed partway through (Supabase Studio runs pasted SQL as one
-- transaction, so a failure anywhere undoes everything in that script,
-- including statements that looked fine). Safe to run more than once.

create or replace function public.get_reengagement_candidates(
  inactive_days int default 3,
  cooldown_days int default 3
)
returns table (user_id uuid, top_choice text)
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
  select la.user_id, tp.choice as top_choice
  from last_active la
  join has_token ht on ht.user_id = la.user_id
  left join recently_notified rn on rn.user_id = la.user_id
  left join top_preference tp on tp.user_id = la.user_id
  where la.last_opened < now() - (inactive_days || ' days')::interval
    and rn.user_id is null;
$$;

revoke execute on function public.get_reengagement_candidates(int, int) from public, anon, authenticated;
grant execute on function public.get_reengagement_candidates(int, int) to service_role;

create or replace function public.get_weekend_session_candidates()
returns table (user_id uuid, top_choice text)
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
  select ht.user_id, tp.choice as top_choice
  from has_token ht
  left join top_preference tp on tp.user_id = ht.user_id;
$$;

revoke execute on function public.get_weekend_session_candidates() from public, anon, authenticated;
grant execute on function public.get_weekend_session_candidates() to service_role;
