-- Baby Log: Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Main events table
create table if not exists public.baby_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  baby_id uuid null,
  event_type text not null check (event_type in ('wet_diaper', 'dirty_diaper', 'feed')),
  occurred_at timestamptz not null,
  feed_side text null check (feed_side is null or feed_side in ('left', 'right')),
  feed_start_time timestamptz null,
  feed_end_time timestamptz null,
  feed_paused_at timestamptz null,
  feed_paused_seconds integer not null default 0,
  duration_minutes integer null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists baby_events_occurred_at_idx
  on public.baby_events (occurred_at desc);

create index if not exists baby_events_event_type_idx
  on public.baby_events (event_type);

create index if not exists baby_events_active_feed_idx
  on public.baby_events (event_type, feed_end_time)
  where event_type = 'feed' and feed_end_time is null;

-- Auto-update updated_at on row changes
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists baby_events_updated_at on public.baby_events;

create trigger baby_events_updated_at
  before update on public.baby_events
  for each row
  execute function public.set_updated_at();

-- Row Level Security (permissive for MVP; tighten when auth is added)
alter table public.baby_events enable row level security;

drop policy if exists "Allow public read baby_events" on public.baby_events;
create policy "Allow public read baby_events"
  on public.baby_events
  for select
  using (true);

drop policy if exists "Allow public insert baby_events" on public.baby_events;
create policy "Allow public insert baby_events"
  on public.baby_events
  for insert
  with check (true);

drop policy if exists "Allow public update baby_events" on public.baby_events;
create policy "Allow public update baby_events"
  on public.baby_events
  for update
  using (true)
  with check (true);

drop policy if exists "Allow public delete baby_events" on public.baby_events;
create policy "Allow public delete baby_events"
  on public.baby_events
  for delete
  using (true);

-- Optional: when Supabase Auth is added, replace policies with:
-- using (auth.uid() = user_id)
