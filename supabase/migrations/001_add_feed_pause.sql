-- Migration: add feed pause support
-- Run in Supabase SQL Editor if baby_events already exists

alter table public.baby_events
  add column if not exists feed_paused_at timestamptz null,
  add column if not exists feed_paused_seconds integer not null default 0;
