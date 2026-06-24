-- Migration: add bottle ounces for bottle feeds
-- Run in Supabase SQL Editor if baby_events already exists

alter table public.baby_events
  add column if not exists bottle_ounces numeric(5, 2) null;
