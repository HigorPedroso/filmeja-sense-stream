-- Fix: pg_cron and pg_net must be installed into schemas literally named
-- "cron" and "net" (that's what cron.schedule()/net.http_post() reference)
-- — "with schema extensions" in the earlier scripts installed them
-- somewhere cron.schedule() couldn't find. Run this once; it recreates the
-- extensions correctly and (re)creates all three cron jobs.

drop extension if exists pg_cron;
drop extension if exists pg_net;

-- No "with schema" — pg_cron/pg_net create and use their own dedicated
-- schemas ("cron" and "net") automatically when installed this way.
create extension pg_cron;
create extension pg_net;

-- Re-create the Vault secret only if it doesn't already exist.
do $$
begin
  if not exists (select 1 from vault.decrypted_secrets where name = 'service_role_key') then
    perform vault.create_secret('YOUR_SERVICE_ROLE_KEY_HERE', 'service_role_key');
  end if;
end $$;

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
