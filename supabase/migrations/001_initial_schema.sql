-- Miriel Phase 1: Initial Schema
-- Run this in Supabase SQL Editor

-- entries 테이블
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  raw_text text not null,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- indexes
create index if not exists entries_user_id_idx on public.entries(user_id);
create index if not exists entries_date_idx on public.entries(user_id, date desc);

-- RLS
alter table public.entries enable row level security;

create policy "Users can view own entries"
  on public.entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on public.entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own entries"
  on public.entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own entries"
  on public.entries for delete
  using (auth.uid() = user_id);

-- summaries 테이블
create table if not exists public.summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null check (period in ('daily', 'weekly')),
  period_start date not null,
  text text not null,
  entry_links uuid[] default '{}',
  created_at timestamptz not null default now()
);

alter table public.summaries enable row level security;

create policy "Users can view own summaries"
  on public.summaries for select
  using (auth.uid() = user_id);

create policy "Users can insert own summaries"
  on public.summaries for insert
  with check (auth.uid() = user_id);

-- todos 테이블
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  source_entry_id uuid references public.entries(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'done')),
  due_date date,
  created_at timestamptz not null default now()
);

alter table public.todos enable row level security;

create policy "Users can view own todos"
  on public.todos for select
  using (auth.uid() = user_id);

create policy "Users can insert own todos"
  on public.todos for insert
  with check (auth.uid() = user_id);

create policy "Users can update own todos"
  on public.todos for update
  using (auth.uid() = user_id);

-- updated_at 자동 갱신 trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger entries_updated_at
  before update on public.entries
  for each row execute function public.handle_updated_at();
