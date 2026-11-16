create table if not exists public.learner_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  daily_goal_minutes smallint not null default 20 check (daily_goal_minutes between 5 and 180),
  preferred_script text not null default 'hiragana' check (preferred_script in ('hiragana', 'katakana')),
  onboarding_completed boolean not null default false,
  streak_days integer not null default 0 check (streak_days >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kana_mastery (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null check (char_length(item_id) between 1 and 120),
  script text not null check (script in ('hiragana', 'katakana')),
  mode text not null check (mode in ('read', 'write')),
  seen_count integer not null default 0 check (seen_count >= 0),
  correct_count integer not null default 0 check (correct_count >= 0 and correct_count <= seen_count),
  correct_streak integer not null default 0 check (correct_streak >= 0),
  due_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id, mode)
);

create index if not exists kana_mastery_due_idx
  on public.kana_mastery (user_id, due_at)
  where correct_streak > 0;

alter table public.learner_settings enable row level security;
alter table public.kana_mastery enable row level security;

revoke all on table public.learner_settings from public, anon, authenticated;
revoke all on table public.kana_mastery from public, anon, authenticated;
grant select, insert, update, delete on table public.learner_settings to authenticated;
grant select, insert, update, delete on table public.kana_mastery to authenticated;

create policy "learners can read their own settings"
  on public.learner_settings for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "learners can create their own settings"
  on public.learner_settings for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "learners can update their own settings"
  on public.learner_settings for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "learners can delete their own settings"
  on public.learner_settings for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "learners can read their own kana mastery"
  on public.kana_mastery for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "learners can create their own kana mastery"
  on public.kana_mastery for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "learners can update their own kana mastery"
  on public.kana_mastery for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "learners can delete their own kana mastery"
  on public.kana_mastery for delete
  to authenticated
  using ((select auth.uid()) = user_id);
