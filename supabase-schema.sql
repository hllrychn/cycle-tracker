-- Run this in the Supabase SQL Editor for your project

create table public.cycles (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  start_date   date        not null,
  end_date     date,
  flow         text        not null
               check (flow in ('spotting','light','medium','heavy')),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, start_date)
);

create table public.symptoms (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  log_date          date        not null,
  mood              text        not null default 'none' check (mood in ('none','mild','moderate','severe')),
  cramps            text        not null default 'none' check (cramps in ('none','mild','moderate','severe')),
  bloating          text        not null default 'none' check (bloating in ('none','mild','moderate','severe')),
  headache          text        not null default 'none' check (headache in ('none','mild','moderate','severe')),
  fatigue           text        not null default 'none' check (fatigue in ('none','mild','moderate','severe')),
  breast_tenderness text        not null default 'none' check (breast_tenderness in ('none','mild','moderate','severe')),
  flow_intensity    text                 check (flow_intensity in ('spotting','light','medium','heavy')),
  other_symptoms    text[],
  discharge         text                 check (discharge in ('dry','sticky','wet','creamy')),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, log_date)
);

-- Migrations (run in Supabase SQL Editor if table already exists):
-- alter table public.symptoms add column if not exists flow_intensity text check (flow_intensity in ('spotting','light','medium','heavy'));
-- alter table public.symptoms add column if not exists other_symptoms text[];
-- alter table public.symptoms add column if not exists bbt numeric;

create index idx_cycles_user_start  on public.cycles  (user_id, start_date desc);
create index idx_symptoms_user_date on public.symptoms (user_id, log_date desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cycles_set_updated_at
  before update on public.cycles
  for each row execute function public.set_updated_at();

create trigger symptoms_set_updated_at
  before update on public.symptoms
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.cycles   enable row level security;
alter table public.symptoms enable row level security;

create policy "cycles: owner select"   on public.cycles for select using (auth.uid() = user_id);
create policy "cycles: owner insert"   on public.cycles for insert with check (auth.uid() = user_id);
create policy "cycles: owner update"   on public.cycles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cycles: owner delete"   on public.cycles for delete using (auth.uid() = user_id);

create policy "symptoms: owner select" on public.symptoms for select using (auth.uid() = user_id);
create policy "symptoms: owner insert" on public.symptoms for insert with check (auth.uid() = user_id);
create policy "symptoms: owner update" on public.symptoms for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "symptoms: owner delete" on public.symptoms for delete using (auth.uid() = user_id);

-- Doctor appointments table
create table public.doctor_appointments (
  id         uuid      primary key default gen_random_uuid(),
  user_id    uuid      not null references auth.users(id) on delete cascade,
  date       date      not null,
  time       text,
  doctor     text,
  facility   text,
  questions  text[]    not null default '{}',
  notes      text,
  tests      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger doctor_appointments_set_updated_at
  before update on public.doctor_appointments
  for each row execute function public.set_updated_at();

alter table public.doctor_appointments enable row level security;

create policy "appointments: owner select" on public.doctor_appointments for select using (auth.uid() = user_id);
create policy "appointments: owner insert" on public.doctor_appointments for insert with check (auth.uid() = user_id);
create policy "appointments: owner update" on public.doctor_appointments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "appointments: owner delete" on public.doctor_appointments for delete using (auth.uid() = user_id);
