-- Run this once in the Supabase Studio SQL Editor (project yynlzhfibeozrwrtrjbs),
-- after user_events.sql. Stores each device's current FCM token so the
-- send-push-notification Edge Function knows where to deliver to.

create table public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  token text not null,
  platform text not null default 'android',
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

create index device_push_tokens_user_id_idx on public.device_push_tokens (user_id);

alter table public.device_push_tokens enable row level security;

-- Users manage only their own device's token. A SELECT policy is required
-- even though the client never reads tokens back directly — the app's
-- upsert() does INSERT ... ON CONFLICT DO UPDATE, and Postgres needs SELECT
-- visibility to check for a conflicting row, even when inserting fresh.
create policy "Users can read their own device token"
  on public.device_push_tokens for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can register their own device token"
  on public.device_push_tokens for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own device token"
  on public.device_push_tokens for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can remove their own device token"
  on public.device_push_tokens for delete
  to authenticated
  using (auth.uid() = user_id);
