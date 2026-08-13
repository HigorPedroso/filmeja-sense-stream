-- Run this once in the Supabase Studio SQL Editor (project yynlzhfibeozrwrtrjbs),
-- after reengagement_notifications.sql (reuses its Vault secret + extensions).
--
-- Unlike get_reengagement_candidates, this targets EVERY user with a device
-- token — no inactivity filter, no cooldown — since it's a recurring
-- Friday/Saturday "what to watch tonight" nudge, not a re-engagement tool.
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

-- Fridays and Saturdays at 22:00 UTC (19:00 in Brasília).
select cron.schedule(
  'weekend-session-notifications',
  '0 22 * * 5,6',
  $$
  select net.http_post(
    url := 'https://yynlzhfibeozrwrtrjbs.supabase.co/functions/v1/send-weekend-session',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
