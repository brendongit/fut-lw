export interface Player {
  id: string;
  owner_id: string;
  name: string;
  phone: string | null;
  photo_url: string | null;
  wins: number;
  created_at: string;
}

export interface Tournament {
  id: string;
  owner_id: string;
  name: string;
  date: string;
  players_per_team: number;
  created_at: string;
}

export interface TournamentPlayer {
  id: string;
  tournament_id: string;
  player_id: string;
  is_substitute: boolean;
  created_at: string;
  player?: Player;
}

export interface TeamMember extends Player {
  is_sub: boolean;
}

export interface Team {
  id: string;
  tournament_id: string;
  name: string;
  logo: string;
  color: string;
  is_reserve: boolean;
  created_at: string;
  players?: TeamMember[];
}

export interface TeamPlayer {
  id: string;
  team_id: string;
  player_id: string;
  created_at: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  winner_team_id: string;
  played_at: string;
}

export interface DashboardStats {
  totalPlayers: number;
  totalTournaments: number;
  totalMatches: number;
  topPlayers: Player[];
}
