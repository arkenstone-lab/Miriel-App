-- profiles 테이블
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  phone text,
  created_at timestamptz not null default now(),
  constraint profiles_username_unique unique (username),
  constraint profiles_username_format check (username ~ '^[a-zA-Z0-9_]{3,20}$')
);

create index if not exists profiles_username_idx on public.profiles(username);

-- RLS
alter table public.profiles enable row level security;
create policy "Anyone can read profiles" on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- username -> email (로그인용, SECURITY DEFINER로 auth.users 접근)
create or replace function public.get_email_by_username(p_username text)
returns text language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  select u.email into v_email from auth.users u
  inner join public.profiles p on p.id = u.id
  where p.username = lower(p_username);
  return v_email;
end; $$;

-- email -> username (아이디 찾기용)
create or replace function public.get_username_by_email(p_email text)
returns text language plpgsql security definer set search_path = public as $$
declare v_username text;
begin
  select p.username into v_username from public.profiles p
  inner join auth.users u on u.id = p.id
  where u.email = lower(p_email);
  return v_username;
end; $$;

-- username 중복 체크
create or replace function public.is_username_available(p_username text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  return not exists (select 1 from public.profiles where username = lower(p_username));
end; $$;

-- anon/authenticated 역할에 RPC 함수 실행 권한 부여
-- (로그인/회원가입 시 인증 전 상태에서 호출해야 하므로 anon 필수)
grant execute on function public.get_email_by_username(text) to anon, authenticated;
grant execute on function public.get_username_by_email(text) to anon, authenticated;
grant execute on function public.is_username_available(text) to anon, authenticated;
