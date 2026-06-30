import { createClient } from "@/lib/supabase/client";
import type { Tournament, TournamentPlayer, Team, TeamMember, Match } from "@/types";

export async function getTournaments(): Promise<Tournament[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getTournament(id: string): Promise<Tournament> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createTournament(input: {
  name: string;
  date: string;
  players_per_team: number;
}): Promise<Tournament> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("tournaments")
    .insert({ ...input, owner_id: user!.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTournament(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("tournaments").delete().eq("id", id);
  if (error) throw error;
}

export async function getTournamentPlayers(tournamentId: string): Promise<TournamentPlayer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tournament_players")
    .select("*, player:players(*)")
    .eq("tournament_id", tournamentId);
  if (error) throw error;
  return data;
}

export async function addPlayerToTournament(
  tournamentId: string,
  playerId: string
): Promise<TournamentPlayer> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tournament_players")
    .insert({ tournament_id: tournamentId, player_id: playerId, is_substitute: true })
    .select("*, player:players(*)")
    .single();
  if (error) throw error;
  return data;
}

export async function removePlayerFromTournament(
  tournamentId: string,
  playerId: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("tournament_players")
    .delete()
    .eq("tournament_id", tournamentId)
    .eq("player_id", playerId);
  if (error) throw error;
}

export async function removeAllPlayersFromTournament(tournamentId: string): Promise<void> {
  const supabase = createClient();
  // Clean up teams first to avoid orphaned team_players
  await resetTeams(tournamentId);
  const { error } = await supabase
    .from("tournament_players")
    .delete()
    .eq("tournament_id", tournamentId);
  if (error) throw error;
}

export async function addAllPlayersToTournament(tournamentId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: allPlayers } = await supabase
    .from("players")
    .select("id")
    .eq("owner_id", user!.id);

  if (!allPlayers?.length) return;

  const { data: existing } = await supabase
    .from("tournament_players")
    .select("player_id")
    .eq("tournament_id", tournamentId);

  const existingIds = new Set(existing?.map((tp) => tp.player_id) ?? []);
  const toAdd = allPlayers.filter((p) => !existingIds.has(p.id));
  if (!toAdd.length) return;

  const { error } = await supabase.from("tournament_players").insert(
    toAdd.map((p) => ({ tournament_id: tournamentId, player_id: p.id, is_substitute: true }))
  );
  if (error) throw error;
}

export async function setSubstitute(
  tournamentId: string,
  playerId: string,
  isSubstitute: boolean
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("tournament_players")
    .update({ is_substitute: isSubstitute })
    .eq("tournament_id", tournamentId)
    .eq("player_id", playerId);
  if (error) throw error;
}

export async function getTeams(tournamentId: string): Promise<Team[]> {
  const supabase = createClient();
  const { data: teams, error } = await supabase
    .from("teams")
    .select("*")
    .eq("tournament_id", tournamentId);
  if (error) throw error;

  const teamsWithPlayers = await Promise.all(
    teams.map(async (team) => {
      const { data: tp } = await supabase
        .from("team_players")
        .select("*, player:players(*)")
        .eq("team_id", team.id);
      const players: TeamMember[] = (tp ?? []).map((t) => ({
        ...t.player,
        is_sub: t.is_sub ?? false,
      }));
      return { ...team, players };
    })
  );

  return teamsWithPlayers;
}

export async function resetTeams(tournamentId: string): Promise<void> {
  const supabase = createClient();
  const { data: existingTeams } = await supabase
    .from("teams")
    .select("id")
    .eq("tournament_id", tournamentId);

  if (existingTeams?.length) {
    await supabase
      .from("team_players")
      .delete()
      .in("team_id", existingTeams.map((t) => t.id));
    await supabase.from("teams").delete().eq("tournament_id", tournamentId);
  }

  // All players remain substitutes (society football — everyone rotates)
  await supabase
    .from("tournament_players")
    .update({ is_substitute: true })
    .eq("tournament_id", tournamentId);
}

export async function setAllSubstitutes(
  tournamentId: string,
  isSub: boolean
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("tournament_players")
    .update({ is_substitute: isSub })
    .eq("tournament_id", tournamentId);
  if (error) throw error;
}

export async function drawTeams(
  tournamentId: string,
  playersPerTeam: number
): Promise<Team[]> {
  const supabase = createClient();

  // Remove existing teams and team_players
  const { data: existingTeams } = await supabase
    .from("teams")
    .select("id")
    .eq("tournament_id", tournamentId);

  if (existingTeams?.length) {
    await supabase
      .from("team_players")
      .delete()
      .in("team_id", existingTeams.map((t) => t.id));
    await supabase.from("teams").delete().eq("tournament_id", tournamentId);
  }

  // Draw from ALL tournament players — the Sub flag only affects the extra-team feature
  const { data: tPlayers, error } = await supabase
    .from("tournament_players")
    .select("*, player:players(*)")
    .eq("tournament_id", tournamentId);

  if (error) throw error;

  const shuffled = [...(tPlayers ?? [])].sort(() => Math.random() - 0.5);

  const teamCount = Math.floor(shuffled.length / playersPerTeam);
  if (teamCount === 0) throw new Error("Jogadores insuficientes para formar times");

  const teamDefs = generateTeamDefs(teamCount);
  const createdTeams: Team[] = [];

  for (let i = 0; i < teamCount; i++) {
    const def = teamDefs[i];
    const { data: team, error: tErr } = await supabase
      .from("teams")
      .insert({
        tournament_id: tournamentId,
        name: def.name,
        color: def.color,
        logo: def.logo,
      })
      .select()
      .single();

    if (tErr) throw tErr;

    const teamPlayers = shuffled.slice(i * playersPerTeam, (i + 1) * playersPerTeam);

    await supabase.from("team_players").insert(
      teamPlayers.map((tp) => ({ team_id: team.id, player_id: tp.player_id }))
    );

    createdTeams.push({ ...team, players: teamPlayers.map((tp) => tp.player) });
  }

  return createdTeams;
}

export async function declareWinner(
  tournamentId: string,
  winnerTeamId: string
): Promise<void> {
  const supabase = createClient();

  // Record match
  await supabase.from("matches").insert({
    tournament_id: tournamentId,
    winner_team_id: winnerTeamId,
    played_at: new Date().toISOString(),
  });

  // Get team players and increment wins
  const { data: teamPlayers } = await supabase
    .from("team_players")
    .select("player_id")
    .eq("team_id", winnerTeamId);

  if (teamPlayers?.length) {
    for (const tp of teamPlayers) {
      await supabase.rpc("increment_wins", { player_id: tp.player_id });
    }
  }
}

export async function getWaitingPlayers(tournamentId: string): Promise<TournamentPlayer[]> {
  const supabase = createClient();

  const { data: teams } = await supabase
    .from("teams")
    .select("id")
    .eq("tournament_id", tournamentId);

  const teamIds = teams?.map((t) => t.id) ?? [];

  let assignedPlayerIds: string[] = [];
  if (teamIds.length > 0) {
    const { data: tp } = await supabase
      .from("team_players")
      .select("player_id")
      .in("team_id", teamIds);
    assignedPlayerIds = tp?.map((t) => t.player_id) ?? [];
  }

  // Any tournament player not assigned to a team
  const { data: tPlayers, error } = await supabase
    .from("tournament_players")
    .select("*, player:players(*)")
    .eq("tournament_id", tournamentId);

  if (error) throw error;

  return (tPlayers ?? []).filter(
    (tp) => !assignedPlayerIds.includes(tp.player_id)
  );
}

export async function drawExtraTeam(
  tournamentId: string,
  playersPerTeam: number
): Promise<Team> {
  const supabase = createClient();

  const waiting = await getWaitingPlayers(tournamentId);

  // Get ALL teams to know which player IDs are already assigned
  const { data: allTeams } = await supabase
    .from("teams")
    .select("id")
    .eq("tournament_id", tournamentId);

  let assignedIds: string[] = [];
  if (allTeams?.length) {
    const { data: tp } = await supabase
      .from("team_players")
      .select("player_id")
      .in("team_id", allTeams.map((t) => t.id));
    assignedIds = tp?.map((t) => t.player_id) ?? [];
  }

  // Only subs NOT already in a team
  const { data: substitutes } = await supabase
    .from("tournament_players")
    .select("*, player:players(*)")
    .eq("tournament_id", tournamentId)
    .eq("is_substitute", true);

  const availableSubs = (substitutes ?? []).filter(
    (tp) => !assignedIds.includes(tp.player_id)
  );

  const subShuffled = [...availableSubs].sort(() => Math.random() - 0.5);
  const pool = [...waiting];

  while (pool.length < playersPerTeam && subShuffled.length > 0) {
    pool.push(subShuffled.shift()!);
  }

  if (pool.length < playersPerTeam) {
    throw new Error("Substitutos insuficientes para completar o time");
  }

  const selected = pool.slice(0, playersPerTeam);

  // Count existing teams to pick next name
  const { data: existingTeams } = await supabase
    .from("teams")
    .select("id")
    .eq("tournament_id", tournamentId);

  const teamDefs = generateTeamDefs(1, (existingTeams?.length ?? 0) + 1);
  const def = teamDefs[0];

  const { data: team, error: tErr } = await supabase
    .from("teams")
    .insert({ tournament_id: tournamentId, name: def.name, color: def.color, logo: def.logo, is_reserve: true })
    .select()
    .single();

  if (tErr) throw tErr;

  await supabase.from("team_players").insert(
    selected.map((tp) => ({ team_id: team.id, player_id: tp.player_id }))
  );

  return { ...team, players: selected.map((tp) => tp.player) };
}

export async function addSubToTeam(teamId: string, playerId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("team_players")
    .insert({ team_id: teamId, player_id: playerId, is_sub: true });
  if (error) throw error;
}

export async function movePlayerBetweenTeams(
  fromTeamId: string,
  toTeamId: string,
  playerId: string
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("team_players")
    .delete()
    .eq("team_id", fromTeamId)
    .eq("player_id", playerId);
  const { error } = await supabase
    .from("team_players")
    .insert({ team_id: toTeamId, player_id: playerId, is_sub: false });
  if (error) throw error;
}

export async function formTeamFromWaiting(
  tournamentId: string,
  playersPerTeam: number
): Promise<Team> {
  const supabase = createClient();

  const waiting = await getWaitingPlayers(tournamentId);
  if (waiting.length === 0) {
    throw new Error("Nenhum jogador aguardando");
  }

  const selected = waiting.slice(0, playersPerTeam);

  const { data: existingTeams } = await supabase
    .from("teams")
    .select("id")
    .eq("tournament_id", tournamentId);

  const teamDefs = generateTeamDefs(1, existingTeams?.length ?? 0);
  const def = teamDefs[0];

  const { data: team, error } = await supabase
    .from("teams")
    .insert({ tournament_id: tournamentId, name: def.name, color: def.color, logo: def.logo })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("team_players").insert(
    selected.map((tp) => ({ team_id: team.id, player_id: tp.player_id }))
  );

  return { ...team, players: selected.map((tp) => tp.player) as any };
}

export async function removePlayerFromTeam(
  teamId: string,
  playerId: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("team_players")
    .delete()
    .eq("team_id", teamId)
    .eq("player_id", playerId);
  if (error) throw error;
}

export async function getMatches(tournamentId: string): Promise<Match[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("played_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getDashboardStats() {
  const supabase = createClient();
  const [playersRes, tournamentsRes, matchesRes, topPlayersRes] = await Promise.all([
    supabase.from("players").select("id", { count: "exact", head: true }),
    supabase.from("tournaments").select("id", { count: "exact", head: true }),
    supabase.from("matches").select("id", { count: "exact", head: true }),
    supabase.from("players").select("*").order("wins", { ascending: false }).limit(5),
  ]);

  return {
    totalPlayers: playersRes.count ?? 0,
    totalTournaments: tournamentsRes.count ?? 0,
    totalMatches: matchesRes.count ?? 0,
    topPlayers: topPlayersRes.data ?? [],
  };
}

const TEAM_NAMES = [
  { name: "Austin Wolves",      color: "#6366f1", emoji: "🐺" },
  { name: "Miami Panthers",     color: "#ec4899", emoji: "🐆" },
  { name: "Phoenix Falcons",    color: "#f59e0b", emoji: "🦅" },
  { name: "Memphis Tigers",     color: "#f97316", emoji: "🐯" },
  { name: "Atlanta Lions",      color: "#22c55e", emoji: "🦁" },
  { name: "Las Vegas Dragons",  color: "#8b5cf6", emoji: "🐉" },
  { name: "Tampa Bay Sharks",   color: "#06b6d4", emoji: "🦈" },
  { name: "Portland Bears",     color: "#84cc16", emoji: "🐻" },
  { name: "Dallas Vipers",      color: "#e11d48", emoji: "🐍" },
  { name: "Seattle Ravens",     color: "#0ea5e9", emoji: "🦅" },
];

function generateTeamDefs(count: number, offset = 0) {
  const shuffled = [...TEAM_NAMES].sort(() => Math.random() - 0.5);
  const start = offset % TEAM_NAMES.length;
  return shuffled.slice(start, start + count).map((t) => ({
    name: t.name,
    color: t.color,
    logo: t.emoji,
  }));
}
