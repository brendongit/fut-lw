import { createClient } from "@/lib/supabase/client";
import type { Tournament, TournamentPlayer, Team, Match } from "@/types";

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
    .insert({ tournament_id: tournamentId, player_id: playerId })
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
      return { ...team, players: tp?.map((t) => t.player) ?? [] };
    })
  );

  return teamsWithPlayers;
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

  // Get active (non-substitute) players
  const { data: tPlayers, error } = await supabase
    .from("tournament_players")
    .select("*, player:players(*)")
    .eq("tournament_id", tournamentId)
    .eq("is_substitute", false);

  if (error) throw error;

  const { data: substitutes } = await supabase
    .from("tournament_players")
    .select("*, player:players(*)")
    .eq("tournament_id", tournamentId)
    .eq("is_substitute", true);

  // Shuffle players
  const shuffled = [...(tPlayers ?? [])].sort(() => Math.random() - 0.5);
  const subShuffled = [...(substitutes ?? [])].sort(() => Math.random() - 0.5);

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

    const startIdx = i * playersPerTeam;
    let teamPlayers = shuffled.slice(startIdx, startIdx + playersPerTeam);

    // If team is short, fill with substitutes
    while (teamPlayers.length < playersPerTeam && subShuffled.length > 0) {
      teamPlayers.push(subShuffled.shift()!);
    }

    if (teamPlayers.length === playersPerTeam) {
      await supabase.from("team_players").insert(
        teamPlayers.map((tp) => ({ team_id: team.id, player_id: tp.player_id }))
      );
    }

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
  { name: "Lobos FC", color: "#6366f1", emoji: "🐺" },
  { name: "Panteras FC", color: "#ec4899", emoji: "🐆" },
  { name: "Falcões FC", color: "#f59e0b", emoji: "🦅" },
  { name: "Tigres FC", color: "#f97316", emoji: "🐯" },
  { name: "Leões FC", color: "#22c55e", emoji: "🦁" },
  { name: "Dragões FC", color: "#8b5cf6", emoji: "🐉" },
  { name: "Tubarões FC", color: "#06b6d4", emoji: "🦈" },
  { name: "Ursos FC", color: "#84cc16", emoji: "🐻" },
];

function generateTeamDefs(count: number) {
  const shuffled = [...TEAM_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((t) => ({
    name: t.name,
    color: t.color,
    logo: t.emoji,
  }));
}
