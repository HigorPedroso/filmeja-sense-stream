-- Run this once in the Supabase Studio SQL Editor (project yynlzhfibeozrwrtrjbs),
-- after user_events.sql and device_push_tokens.sql.
--
-- Computes who should get the daily re-engagement push: users inactive for
-- 3+ days, who own a device token, who weren't already re-engaged in the
-- last 3 days, paired with their single most-picked mood/genre.
--
-- Restricted to service_role only — this returns behavioral data (activity
-- gaps, preferences) about every user, so it must never be callable with the
-- anon or authenticated key.
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

-- --- Scheduling ------------------------------------------------------------
-- Runs the send-smart-reengagement Edge Function daily at 22:00 UTC
-- (19:00 in Brasília — Brazil has had no DST since 2019, so this stays fixed
-- year-round). Requires the pg_cron and pg_net extensions.

-- No "with schema" — pg_cron/pg_net create and use their own dedicated
-- schemas ("cron" and "net") automatically when installed this way.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Stores the service role key in Vault so the cron job can authenticate
-- without the key sitting in plain SQL. Replace the placeholder, run once.
select vault.create_secret('YOUR_SERVICE_ROLE_KEY_HERE', 'service_role_key');

select cron.schedule(
  'daily-reengagement-notifications',
  '0 22 * * *',
  $$
  select net.http_post(
    url := 'https://yynlzhfibeozrwrtrjbs.supabase.co/functions/v1/send-smart-reengagement',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
