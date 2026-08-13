-- Run this once in the Supabase Studio SQL Editor (project yynlzhfibeozrwrtrjbs).
-- Append-only event log powering "smart" push notifications: favorite
-- genres/moods, active hours, rejected recommendations, saved titles, and
-- whether notifications actually get opened.

create table public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index user_events_user_id_idx on public.user_events (user_id);
create index user_events_event_type_idx on public.user_events (event_type);
create index user_events_created_at_idx on public.user_events (created_at);

alter table public.user_events enable row level security;

-- Events are an append-only log: users can write and read their own, no
-- update/delete policies (nothing should ever mutate a past event).
create policy "Users can insert their own events"
  on public.user_events for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can read their own events"
  on public.user_events for select
  to authenticated
  using (auth.uid() = user_id);
