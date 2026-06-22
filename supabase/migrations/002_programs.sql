-- ────────────────────────────────────────────────────────────
-- TABLE: programs
-- ────────────────────────────────────────────────────────────
create table if not exists public.programs (
  id           uuid primary key default uuid_generate_v4(),
  mosque_id    uuid not null references public.mosques(id) on delete cascade,
  title        text not null,
  description  text null,
  date         date not null,
  start_time   time not null,
  end_time     time null,
  speaker      text null,
  category     text not null default 'kajian',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- INDEXES
create index if not exists idx_programs_mosque  on public.programs(mosque_id);
create index if not exists idx_programs_date    on public.programs(date);

-- TRIGGER: auto-update updated_at
drop trigger if exists tg_programs_updated_at on public.programs;
create trigger tg_programs_updated_at
  before update on public.programs
  for each row execute function public.handle_updated_at();

-- RLS POLICIES
alter table public.programs enable row level security;

create policy "programs_public_read" on public.programs for select using (true);
create policy "programs_admin_all"   on public.programs for all
  using (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin','mosque_admin')));
