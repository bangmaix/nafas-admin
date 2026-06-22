-- ────────────────────────────────────────────────────────────
-- TABLE: families
-- ────────────────────────────────────────────────────────────
create table if not exists public.families (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  address      text null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- TABLE: family_members
-- ────────────────────────────────────────────────────────────
create table if not exists public.family_members (
  id           uuid primary key default uuid_generate_v4(),
  family_id    uuid not null references public.families(id) on delete cascade,
  user_id      uuid not null references public.user_profiles(id) on delete cascade,
  relation     text not null default 'anggota' check (relation in ('kepala','pasangan','anak','anggota')),
  created_at   timestamptz not null default now(),

  unique(family_id, user_id)
);

-- INDEXES
create index if not exists idx_family_members_family  on public.family_members(family_id);
create index if not exists idx_family_members_user    on public.family_members(user_id);

-- TRIGGER: auto-update updated_at on families
drop trigger if exists tg_families_updated_at on public.families;
create trigger tg_families_updated_at
  before update on public.families
  for each row execute function public.handle_updated_at();

-- RLS POLICIES
alter table public.families       enable row level security;
alter table public.family_members enable row level security;

create policy "families_public_read" on public.families for select using (true);
create policy "families_admin_all"   on public.families for all
  using (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin','mosque_admin')));

create policy "family_members_public_read" on public.family_members for select using (true);
create policy "family_members_admin_all"   on public.family_members for all
  using (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin','mosque_admin')));
