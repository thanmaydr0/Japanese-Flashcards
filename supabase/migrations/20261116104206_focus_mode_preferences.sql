alter table public.learner_settings
  add column if not exists focus_mode_enabled boolean not null default false;

comment on column public.learner_settings.focus_mode_enabled is
  'User-selected focus-friendly interface preference; not a diagnosis.';
