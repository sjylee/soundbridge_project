-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Creates the audiogram_profiles table and locks it down with Row Level Security
-- so each user can only ever see/change their own rows.

create table if not exists public.audiogram_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_name text not null,
  left_ear jsonb not null,
  right_ear jsonb not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.audiogram_profiles enable row level security;

create policy "Users can view their own audiogram profiles"
  on public.audiogram_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own audiogram profiles"
  on public.audiogram_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own audiogram profiles"
  on public.audiogram_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own audiogram profiles"
  on public.audiogram_profiles for delete
  using (auth.uid() = user_id);
