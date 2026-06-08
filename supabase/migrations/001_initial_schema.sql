-- ============================================================
-- NAFAS Admin — Initial Schema
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- ────────────────────────────────────────────────────────────
-- TABLE: mosques
-- ────────────────────────────────────────────────────────────
create table if not exists public.mosques (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  address           text not null default '',
  city              text not null,
  province          text not null default '',
  latitude          double precision not null,
  longitude         double precision not null,
  geofence_radius   integer not null default 100,
  geofence_polygon  geometry(Polygon, 4326) null,
  photo_url         text null,
  total_members     integer not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- TABLE: user_profiles
-- ────────────────────────────────────────────────────────────
create table if not exists public.user_profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  full_name         text not null default '',
  email             text not null default '',
  avatar_url        text null,
  role              text not null default 'jamaah' check (role in ('admin','mosque_admin','jamaah')),
  total_points      integer not null default 0,
  total_attendance  integer not null default 0,
  streak_days       integer not null default 0,
  mosque_id         uuid null references public.mosques(id) on delete set null,
  created_at        timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- TABLE: qr_sessions
-- ────────────────────────────────────────────────────────────
create table if not exists public.qr_sessions (
  id          uuid primary key default uuid_generate_v4(),
  mosque_id   uuid not null references public.mosques(id) on delete cascade,
  prayer_name text not null check (prayer_name in ('subuh','dzuhur','ashar','maghrib','isya')),
  token       text not null unique,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- TABLE: attendance
-- ────────────────────────────────────────────────────────────
create table if not exists public.attendance (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.user_profiles(id) on delete cascade,
  mosque_id      uuid not null references public.mosques(id) on delete cascade,
  prayer_name    text not null check (prayer_name in ('subuh','dzuhur','ashar','maghrib','isya')),
  method         text not null default 'qr' check (method in ('qr','geo')),
  latitude       double precision null,
  longitude      double precision null,
  checked_in_at  timestamptz not null default now(),
  points_earned  integer not null default 10,
  is_valid       boolean not null default true
);

-- ────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────
create index if not exists idx_mosques_is_active     on public.mosques(is_active);
create index if not exists idx_mosques_city          on public.mosques(city);
create index if not exists idx_mosques_geofence      on public.mosques using gist(geofence_polygon);

create index if not exists idx_user_profiles_role    on public.user_profiles(role);
create index if not exists idx_user_profiles_mosque  on public.user_profiles(mosque_id);

create index if not exists idx_attendance_user       on public.attendance(user_id);
create index if not exists idx_attendance_mosque     on public.attendance(mosque_id);
create index if not exists idx_attendance_checkedin  on public.attendance(checked_in_at desc);
create index if not exists idx_attendance_prayer     on public.attendance(prayer_name);

create index if not exists idx_qr_sessions_mosque   on public.qr_sessions(mosque_id);
create index if not exists idx_qr_sessions_expires  on public.qr_sessions(expires_at);

-- ────────────────────────────────────────────────────────────
-- TRIGGER: auto-update updated_at on mosques
-- ────────────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tg_mosques_updated_at on public.mosques;
create trigger tg_mosques_updated_at
  before update on public.mosques
  for each row execute function public.handle_updated_at();

-- ────────────────────────────────────────────────────────────
-- TRIGGER: auto-create user_profile on auth.users insert
-- ────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'jamaah')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists tg_on_auth_user_created on auth.users;
create trigger tg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- TRIGGER: sync total_members on user_profiles changes
-- ────────────────────────────────────────────────────────────
create or replace function public.sync_mosque_total_members()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' and new.mosque_id is not null then
    update public.mosques set total_members = total_members + 1 where id = new.mosque_id;
  elsif TG_OP = 'DELETE' and old.mosque_id is not null then
    update public.mosques set total_members = greatest(total_members - 1, 0) where id = old.mosque_id;
  elsif TG_OP = 'UPDATE' then
    if old.mosque_id is distinct from new.mosque_id then
      if old.mosque_id is not null then
        update public.mosques set total_members = greatest(total_members - 1, 0) where id = old.mosque_id;
      end if;
      if new.mosque_id is not null then
        update public.mosques set total_members = total_members + 1 where id = new.mosque_id;
      end if;
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists tg_sync_mosque_members on public.user_profiles;
create trigger tg_sync_mosque_members
  after insert or update or delete on public.user_profiles
  for each row execute function public.sync_mosque_total_members();

-- ────────────────────────────────────────────────────────────
-- RLS POLICIES
-- ────────────────────────────────────────────────────────────
alter table public.mosques       enable row level security;
alter table public.user_profiles enable row level security;
alter table public.attendance    enable row level security;
alter table public.qr_sessions   enable row level security;

-- mosques: public read, admin write
create policy "mosques_public_read"  on public.mosques for select using (true);
create policy "mosques_admin_insert" on public.mosques for insert
  with check (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin','mosque_admin')));
create policy "mosques_admin_update" on public.mosques for update
  using (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin','mosque_admin')));
create policy "mosques_admin_delete" on public.mosques for delete
  using (exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin'));

-- user_profiles: users read all, write own
create policy "profiles_public_read"  on public.user_profiles for select using (true);
create policy "profiles_own_update"   on public.user_profiles for update using (auth.uid() = id);
create policy "profiles_service_insert" on public.user_profiles for insert with check (true);

-- attendance: users read all, insert own
create policy "attendance_public_read"  on public.attendance for select using (true);
create policy "attendance_own_insert"   on public.attendance for insert with check (auth.uid() = user_id);
create policy "attendance_admin_delete" on public.attendance for delete
  using (exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin'));

-- qr_sessions: admin manage
create policy "qr_admin_all" on public.qr_sessions for all
  using (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin','mosque_admin')));

-- ────────────────────────────────────────────────────────────
-- SEED: insert admin user profile (bangmaix@gmail.com)
-- ────────────────────────────────────────────────────────────
insert into public.user_profiles (id, full_name, email, role)
select
  au.id,
  'Rahmad Syah Mulya',
  au.email,
  'admin'
from auth.users au
where au.email = 'bangmaix@gmail.com'
on conflict (id) do update set
  full_name = excluded.full_name,
  role      = excluded.role;
