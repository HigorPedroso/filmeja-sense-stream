-- Run once in the Supabase Studio SQL Editor (project yynlzhfibeozrwrtrjbs).
--
-- device_push_tokens.updated_at was being set by the client
-- (src/lib/push/pushNotifications.ts) from the device's own clock. Devices
-- with a wrong system clock wrote garbage future timestamps. The client no
-- longer sends this column — this trigger sets it from the server clock on
-- every insert/update instead, so it stays a trustworthy "last confirmed
-- working" signal for future staleness cleanup.

create or replace function public.set_device_push_token_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_device_push_tokens_updated_at on public.device_push_tokens;

create trigger trg_device_push_tokens_updated_at
  before insert or update on public.device_push_tokens
  for each row
  execute function public.set_device_push_token_updated_at();
