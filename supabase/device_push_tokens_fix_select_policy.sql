-- Fix: the upsert() in the app (INSERT ... ON CONFLICT DO UPDATE) needs a
-- SELECT policy to check for conflicting rows, even on a fresh insert with
-- no existing row — without it, PostgreSQL rejects the whole upsert as an
-- RLS violation. Missed this in the original device_push_tokens.sql.
create policy "Users can read their own device token"
  on public.device_push_tokens for select
  to authenticated
  using (auth.uid() = user_id);
