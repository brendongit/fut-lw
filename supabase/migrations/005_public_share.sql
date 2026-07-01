-- Public read-only sharing of a tournament via an unguessable token

alter table tournaments add column if not exists share_token uuid unique not null default uuid_generate_v4();

-- Snapshot of which players were on the winning team at the moment a match was won,
-- since a player can move between teams over the course of a tournament.
create table if not exists match_players (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references matches(id) on delete cascade not null,
  tournament_id uuid references tournaments(id) on delete cascade not null,
  player_id uuid references players(id) on delete cascade not null,
  team_id uuid references teams(id) on delete cascade not null,
  created_at timestamptz not null default now()
);

alter table match_players enable row level security;

create policy "match_players_select" on match_players for select
  using (exists (select 1 from tournaments t where t.id = tournament_id and t.owner_id = auth.uid()));
create policy "match_players_insert" on match_players for insert
  with check (exists (select 1 from tournaments t where t.id = tournament_id and t.owner_id = auth.uid()));

-- Public (anon) read access, scoped strictly to the token — no RLS policy is opened
-- on the underlying tables for anon; these security definer functions are the only
-- public entry points and each one filters by tournament share_token internally.

create or replace function public_get_tournament(p_token uuid)
returns table (id uuid, name text, date date, players_per_team integer)
language sql security definer set search_path = public as $$
  select id, name, date, players_per_team
  from tournaments
  where share_token = p_token;
$$;

create or replace function public_get_teams(p_token uuid)
returns table (
  team_id uuid,
  team_name text,
  team_logo text,
  team_color text,
  is_reserve boolean,
  player_id uuid,
  player_name text,
  player_photo_url text,
  is_sub boolean
)
language sql security definer set search_path = public as $$
  select tm.id, tm.name, tm.logo, tm.color, tm.is_reserve,
         p.id, p.name, p.photo_url, coalesce(tp.is_sub, false)
  from teams tm
  join tournaments t on t.id = tm.tournament_id and t.share_token = p_token
  left join team_players tp on tp.team_id = tm.id
  left join players p on p.id = tp.player_id;
$$;

create or replace function public_get_points(p_token uuid)
returns table (
  player_id uuid,
  player_name text,
  player_photo_url text,
  team_id uuid,
  team_name text,
  team_logo text,
  team_color text,
  played_at timestamptz
)
language sql security definer set search_path = public as $$
  select p.id, p.name, p.photo_url, tm.id, tm.name, tm.logo, tm.color, m.played_at
  from match_players mp
  join tournaments t on t.id = mp.tournament_id and t.share_token = p_token
  join players p on p.id = mp.player_id
  join teams tm on tm.id = mp.team_id
  join matches m on m.id = mp.match_id
  order by m.played_at desc;
$$;

grant execute on function public_get_tournament(uuid) to anon, authenticated;
grant execute on function public_get_teams(uuid) to anon, authenticated;
grant execute on function public_get_points(uuid) to anon, authenticated;
