create table if not exists public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null check (char_length(token) between 32 and 4096),
  platform text not null check (platform in ('android', 'ios')),
  enabled boolean not null default true,
  timezone text not null default 'UTC',
  reminder_hour smallint not null default 19 check (reminder_hour between 0 and 23),
  reminder_minute smallint not null default 0 check (reminder_minute between 0 and 59),
  last_nudge_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

create index if not exists push_devices_enabled_idx
  on public.push_devices (enabled, reminder_hour, reminder_minute)
  where enabled = true;

alter table public.push_devices enable row level security;

revoke all on table public.push_devices from public, anon, authenticated;
grant select, insert, update, delete on table public.push_devices to authenticated;

create policy "learners can read their own push devices"
  on public.push_devices for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "learners can register their own push devices"
  on public.push_devices for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "learners can update their own push devices"
  on public.push_devices for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "learners can remove their own push devices"
  on public.push_devices for delete
  to authenticated
  using ((select auth.uid()) = user_id);
