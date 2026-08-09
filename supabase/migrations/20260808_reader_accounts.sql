create table if not exists public.reader_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_key text not null default 'clancy',
  reader_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint reader_profiles_avatar_key_check check (avatar_key in (
    'clancy-masked', 'clancy', 'mara-bandito', 'ned', 'nico', 'torchbearer', 'mara'
  ))
);

alter table public.reader_profiles enable row level security;

drop policy if exists "Readers can view their own profile" on public.reader_profiles;
create policy "Readers can view their own profile"
  on public.reader_profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Readers can insert their own profile" on public.reader_profiles;
create policy "Readers can insert their own profile"
  on public.reader_profiles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Readers can update their own profile" on public.reader_profiles;
create policy "Readers can update their own profile"
  on public.reader_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on table public.reader_profiles to authenticated;
revoke all on table public.reader_profiles from anon;

create or replace function public.set_reader_profile_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists reader_profiles_updated_at on public.reader_profiles;
create trigger reader_profiles_updated_at
before update on public.reader_profiles
for each row execute function public.set_reader_profile_updated_at();
