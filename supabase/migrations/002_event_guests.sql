-- Meridian · event guests (Guest Messaging v1)
-- Run in Supabase → SQL Editor after 001_inquiries.sql
-- Safe to re-run.

create table if not exists public.event_guests (
  id text primary key,
  inquiry_id text not null references public.inquiries (id) on delete cascade,
  host_user_id text not null,
  name text not null,
  email text not null,
  invite_token text not null unique,
  rsvp_status text not null default 'pending'
    check (rsvp_status in ('pending', 'accepted', 'declined')),
  has_allergy boolean not null default false,
  allergy_note text,
  event_title text,
  event_location text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_guests_inquiry_idx on public.event_guests (inquiry_id);
create index if not exists event_guests_host_idx on public.event_guests (host_user_id);
create index if not exists event_guests_token_idx on public.event_guests (invite_token);

alter table public.event_guests enable row level security;

-- Public guests open invite by token via Express (service role).
-- Anon may select by token for future client-side hydrate; writes stay server-side.
drop policy if exists "event_guests_select_by_token" on public.event_guests;
create policy "event_guests_select_by_token"
  on public.event_guests
  for select
  to anon, authenticated
  using (true);

select 'event_guests ready' as ok, count(*)::int as rows from public.event_guests;
