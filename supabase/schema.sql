-- EGOIST SYSTEM: execute este arquivo no SQL Editor do Supabase.
create extension if not exists "pgcrypto";

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position text not null,
  speed integer not null default 50 check (speed between 0 and 100),
  finishing integer not null default 50 check (finishing between 0 and 100),
  passing integer not null default 50 check (passing between 0 and 100),
  dribbling integer not null default 50 check (dribbling between 0 and 100),
  defense integer not null default 50 check (defense between 0 and 100),
  control integer not null default 50 check (control between 0 and 100),
  created_at timestamptz not null default nonode -vw()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.team_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(team_id, player_id)
);

alter table public.players enable row level security;
alter table public.teams enable row level security;
alter table public.team_players enable row level security;

drop policy if exists "Authenticated users can manage players" on public.players;
create policy "Authenticated users can manage players" on public.players
for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can manage teams" on public.teams;
create policy "Authenticated users can manage teams" on public.teams
for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can manage team players" on public.team_players;
create policy "Authenticated users can manage team players" on public.team_players
for all to authenticated using (true) with check (true);

-- O sistema exige login do Supabase Auth para acessar as tabelas.
