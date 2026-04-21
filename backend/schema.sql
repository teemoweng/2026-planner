-- 2026 Planner — Supabase schema
-- Paste into Supabase SQL editor to bootstrap the database.
-- Assumes Supabase Auth is enabled (auth.users table exists).

-- ─────────────────────────────────────────────────────────────
-- Planner data tables (one row per user × slice)
-- ─────────────────────────────────────────────────────────────

create table if not exists planner_day_data (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  date       date        not null,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create table if not exists planner_month_data (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  year       int         not null,
  month      int         not null,  -- 0-indexed to match JS Date
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, year, month)
);

create table if not exists planner_week_data (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  week_key   text        not null,   -- e.g. "2026-W17"
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, week_key)
);

create table if not exists planner_notes (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  date       date        not null,
  content    text        not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create table if not exists user_settings (
  user_id    uuid        primary key references auth.users(id) on delete cascade,
  theme      text        not null default 'amber',
  view       text        not null default 'month',
  tweaks     jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Whole-planner blob per user (MVP: keeps frontend diff tiny).
-- Later can be split back into the per-date tables above.
-- ─────────────────────────────────────────────────────────────

create table if not exists user_data (
  user_id    uuid        primary key references auth.users(id) on delete cascade,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- AI usage log (for per-user rate limiting + abuse detection)
-- ─────────────────────────────────────────────────────────────

create table if not exists ai_usage (
  id            bigserial primary key,
  user_id       uuid      not null references auth.users(id) on delete cascade,
  at            timestamptz not null default now(),
  input_tokens  int,
  output_tokens int,
  model         text,
  provider      text
);
create index if not exists ai_usage_user_at_idx on ai_usage (user_id, at desc);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security: every user sees only their own rows.
-- Service role (used by backend) bypasses RLS automatically.
-- ─────────────────────────────────────────────────────────────

alter table planner_day_data   enable row level security;
alter table planner_month_data enable row level security;
alter table planner_week_data  enable row level security;
alter table planner_notes      enable row level security;
alter table user_settings      enable row level security;
alter table user_data          enable row level security;
alter table ai_usage           enable row level security;

do $$ begin
  create policy "own_rows" on user_data
    using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "own_rows" on planner_day_data
    using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "own_rows" on planner_month_data
    using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "own_rows" on planner_week_data
    using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "own_rows" on planner_notes
    using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "own_rows" on user_settings
    using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  -- ai_usage: users read their own; writes go through backend service role only
  create policy "own_reads" on ai_usage for select using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────
-- Free-tier quota helper: count this user's AI calls in last 24h.
-- Backend queries this before forwarding to the LLM.
-- ─────────────────────────────────────────────────────────────

create or replace function ai_usage_last_24h(uid uuid)
returns int
language sql
stable
as $$
  select count(*)::int from ai_usage
  where user_id = uid and at > now() - interval '24 hours';
$$;
