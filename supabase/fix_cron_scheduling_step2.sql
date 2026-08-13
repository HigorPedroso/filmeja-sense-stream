-- The Vault secret and pg_cron/pg_net extensions already exist from the
-- previous run — this just (re)creates the 3 cron jobs.

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
