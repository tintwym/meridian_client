-- Meridian · Club accounts, sessions, OTP, plans, wishlist, vault, points
-- Run in Supabase → SQL Editor after 001_inquiries.sql and 002_event_guests.sql
-- Project: https://supabase.com/dashboard/project/iqwpwelnkczubaoevowj/sql
-- Safe to re-run. Service role (Express SUPABASE_SECRET_KEY) bypasses RLS.

create table if not exists public.club_users (
  id text primary key,
  email text not null unique,
  name text not null,
  password_hash text not null default '',
  google_sub text,
  apple_sub text,
  points integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists club_users_email_idx on public.club_users (email);
create index if not exists club_users_google_idx on public.club_users (google_sub);
create index if not exists club_users_apple_idx on public.club_users (apple_sub);

create table if not exists public.club_sessions (
  token text primary key,
  user_id text not null references public.club_users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists club_sessions_user_idx on public.club_sessions (user_id);

create table if not exists public.club_otps (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.club_ledger (
  id text primary key,
  user_id text not null references public.club_users (id) on delete cascade,
  delta integer not null,
  reason text not null,
  created_at timestamptz not null default now(),
  balance_after integer not null default 0
);

create index if not exists club_ledger_user_idx on public.club_ledger (user_id, created_at desc);

create table if not exists public.club_plans (
  id text primary key,
  user_id text not null references public.club_users (id) on delete cascade,
  title text not null,
  plan jsonb,
  input jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists club_plans_user_idx on public.club_plans (user_id, updated_at desc);

create table if not exists public.club_wishlist (
  id text primary key,
  user_id text not null references public.club_users (id) on delete cascade,
  label text not null,
  location_type text not null default 'overseas'
    check (location_type in ('local', 'overseas')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists club_wishlist_user_idx on public.club_wishlist (user_id, created_at desc);

create table if not exists public.club_vault (
  id text primary key,
  user_id text not null references public.club_users (id) on delete cascade,
  title text not null,
  kind text not null default 'proposal',
  summary text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists club_vault_user_idx on public.club_vault (user_id, created_at desc);

alter table public.club_users enable row level security;
alter table public.club_sessions enable row level security;
alter table public.club_otps enable row level security;
alter table public.club_ledger enable row level security;
alter table public.club_plans enable row level security;
alter table public.club_wishlist enable row level security;
alter table public.club_vault enable row level security;

-- No anon policies: password hashes and sessions stay server-only (service role).

select 'club platform tables ready' as ok;
