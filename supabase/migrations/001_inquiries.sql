-- Meridian · create inquiries (run ALL of this in Supabase → SQL Editor → Run)
-- Project: https://supabase.com/dashboard/project/iqwpwelnkczubaoevowj/sql
-- Safe to re-run.

create table if not exists public.inquiries (
  id text primary key,
  user_id text,
  name text not null,
  email text not null,
  phone text,
  location text,
  date text,
  budget text,
  vision text,
  plan_title text,
  plan_tagline text,
  status text not null default 'received'
    check (status in ('received', 'assigned', 'call_scheduled', 'deposit', 'completed')),
  points_redeemed integer not null default 0,
  credit_applied_usd integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inquiries_user_id_idx on public.inquiries (user_id);
create index if not exists inquiries_user_updated_idx on public.inquiries (user_id, updated_at desc);

alter table public.inquiries replica identity full;

alter table public.inquiries enable row level security;

drop policy if exists "inquiries_select_for_clients" on public.inquiries;
create policy "inquiries_select_for_clients"
  on public.inquiries
  for select
  to anon, authenticated
  using (true);

-- Realtime: ignore if already added
do $$
begin
  begin
    alter publication supabase_realtime add table public.inquiries;
  exception
    when duplicate_object then null;
    when others then
      -- already in publication (various PG versions)
      if sqlerrm ilike '%already%member%' or sqlerrm ilike '%already exists%' then
        null;
      else
        raise;
      end if;
  end;
end $$;

-- Quick check (should return inquiries)
select 'inquiries ready' as ok, count(*)::int as rows from public.inquiries;
