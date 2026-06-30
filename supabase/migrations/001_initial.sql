-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Players table
create table if not exists players (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  phone text,
  photo_url text,
  wins integer not null default 0,
  created_at timestamptz not null default now()
);

-- Tournaments table
create table if not exists tournaments (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  date date not null,
  players_per_team integer not null default 5,
  created_at timestamptz not null default now()
);

-- Tournament players
create table if not exists tournament_players (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid references tournaments(id) on delete cascade not null,
  player_id uuid references players(id) on delete cascade not null,
  is_substitute boolean not null default false,
  created_at timestamptz not null default now(),
  unique(tournament_id, player_id)
);

-- Teams
create table if not exists teams (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid references tournaments(id) on delete cascade not null,
  name text not null,
  logo text,
  color text,
  created_at timestamptz not null default now()
);

-- Team players
create table if not exists team_players (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references teams(id) on delete cascade not null,
  player_id uuid references players(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(team_id, player_id)
);

-- Matches
create table if not exists matches (
  id uuid primary key default uuid_generate_v4(),
  tournament_id uuid references tournaments(id) on delete cascade not null,
  winner_team_id uuid references teams(id) on delete set null,
  played_at timestamptz not null default now()
);

-- RLS
alter table players enable row level security;
alter table tournaments enable row level security;
alter table tournament_players enable row level security;
alter table teams enable row level security;
alter table team_players enable row level security;
alter table matches enable row level security;

-- Players policies
create policy "players_select" on players for select using (auth.uid() = owner_id);
create policy "players_insert" on players for insert with check (auth.uid() = owner_id);
create policy "players_update" on players for update using (auth.uid() = owner_id);
create policy "players_delete" on players for delete using (auth.uid() = owner_id);

-- Tournaments policies
create policy "tournaments_select" on tournaments for select using (auth.uid() = owner_id);
create policy "tournaments_insert" on tournaments for insert with check (auth.uid() = owner_id);
create policy "tournaments_update" on tournaments for update using (auth.uid() = owner_id);
create policy "tournaments_delete" on tournaments for delete using (auth.uid() = owner_id);

-- Tournament players policies (via tournament owner)
create policy "tp_select" on tournament_players for select
  using (exists (select 1 from tournaments t where t.id = tournament_id and t.owner_id = auth.uid()));
create policy "tp_insert" on tournament_players for insert
  with check (exists (select 1 from tournaments t where t.id = tournament_id and t.owner_id = auth.uid()));
create policy "tp_update" on tournament_players for update
  using (exists (select 1 from tournaments t where t.id = tournament_id and t.owner_id = auth.uid()));
create policy "tp_delete" on tournament_players for delete
  using (exists (select 1 from tournaments t where t.id = tournament_id and t.owner_id = auth.uid()));

-- Teams policies
create policy "teams_select" on teams for select
  using (exists (select 1 from tournaments t where t.id = tournament_id and t.owner_id = auth.uid()));
create policy "teams_insert" on teams for insert
  with check (exists (select 1 from tournaments t where t.id = tournament_id and t.owner_id = auth.uid()));
create policy "teams_update" on teams for update
  using (exists (select 1 from tournaments t where t.id = tournament_id and t.owner_id = auth.uid()));
create policy "teams_delete" on teams for delete
  using (exists (select 1 from tournaments t where t.id = tournament_id and t.owner_id = auth.uid()));

-- Team players policies
create policy "team_players_select" on team_players for select
  using (exists (
    select 1 from teams tm
    join tournaments t on t.id = tm.tournament_id
    where tm.id = team_id and t.owner_id = auth.uid()
  ));
create policy "team_players_insert" on team_players for insert
  with check (exists (
    select 1 from teams tm
    join tournaments t on t.id = tm.tournament_id
    where tm.id = team_id and t.owner_id = auth.uid()
  ));
create policy "team_players_delete" on team_players for delete
  using (exists (
    select 1 from teams tm
    join tournaments t on t.id = tm.tournament_id
    where tm.id = team_id and t.owner_id = auth.uid()
  ));

-- Matches policies
create policy "matches_select" on matches for select
  using (exists (select 1 from tournaments t where t.id = tournament_id and t.owner_id = auth.uid()));
create policy "matches_insert" on matches for insert
  with check (exists (select 1 from tournaments t where t.id = tournament_id and t.owner_id = auth.uid()));

-- Function to increment wins
create or replace function increment_wins(player_id uuid)
returns void as $$
  update players set wins = wins + 1 where id = player_id;
$$ language sql security definer;

-- Storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_select" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_insert" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "avatars_update" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid() = owner);
create policy "avatars_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid() = owner);
