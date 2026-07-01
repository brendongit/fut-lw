-- Let the public page look up the exact roster of a team for a specific win,
-- so a player's point history can drill down into "who was on the team that day".

drop function if exists public_get_points(uuid);

create function public_get_points(p_token uuid)
returns table (
  match_id uuid,
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
  select m.id, p.id, p.name, p.photo_url, tm.id, tm.name, tm.logo, tm.color, m.played_at
  from match_players mp
  join tournaments t on t.id = mp.tournament_id and t.share_token = p_token
  join players p on p.id = mp.player_id
  join teams tm on tm.id = mp.team_id
  join matches m on m.id = mp.match_id
  order by m.played_at desc;
$$;

create or replace function public_get_match_roster(p_token uuid, p_match_id uuid, p_team_id uuid)
returns table (player_id uuid, player_name text, player_photo_url text)
language sql security definer set search_path = public as $$
  select p.id, p.name, p.photo_url
  from match_players mp
  join tournaments t on t.id = mp.tournament_id and t.share_token = p_token
  join players p on p.id = mp.player_id
  where mp.match_id = p_match_id and mp.team_id = p_team_id;
$$;

grant execute on function public_get_points(uuid) to anon, authenticated;
grant execute on function public_get_match_roster(uuid, uuid, uuid) to anon, authenticated;
