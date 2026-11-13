-- Meridian · planner admin accounts (survives serverless — no local JSON file)
-- Run after 001–003. Service role bypasses RLS.

create table if not exists public.admin_users (
  id text primary key,
  email text not null unique,
  name text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_users_email_idx on public.admin_users (email);

alter table public.admin_users enable row level security;

-- No anon policies: admin hashes stay server-only (service role).

select 'admin_users table ready' as ok;
