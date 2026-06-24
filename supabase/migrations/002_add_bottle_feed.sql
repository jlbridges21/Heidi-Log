-- Migration: allow bottle as a feed method
-- Run in Supabase SQL Editor if baby_events already exists

alter table public.baby_events
  drop constraint if exists baby_events_feed_side_check;

alter table public.baby_events
  add constraint baby_events_feed_side_check
  check (feed_side is null or feed_side in ('left', 'right', 'bottle'));
