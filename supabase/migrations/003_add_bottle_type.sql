-- Migration: add bottle contents type (breast milk or formula)
-- Run in Supabase SQL Editor if baby_events already exists

alter table public.baby_events
  add column if not exists bottle_type text null;

alter table public.baby_events
  drop constraint if exists baby_events_bottle_type_check;

alter table public.baby_events
  add constraint baby_events_bottle_type_check
  check (bottle_type is null or bottle_type in ('breast_milk', 'formula'));
