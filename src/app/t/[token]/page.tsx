"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  getPublicTournament,
  getPublicTeams,
  getPublicPoints,
  getPublicMatchRoster,
} from "@/services/tournaments";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { Calendar, Users, Trophy, Shield } from "lucide-react";
import type { PublicTeamPlayer, PublicPoint } from "@/types";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function groupTeams(rows: PublicTeamPlayer[]) {
  const map = new Map<
    string,
    { id: string; name: string; logo: string; color: string; isReserve: boolean; players: PublicTeamPlayer[] }
  >();
  for (const row of rows) {
    if (!map.has(row.team_id)) {
      map.set(row.team_id, {
        id: row.team_id,
        name: row.team_name,
        logo: row.team_logo,
        color: row.team_color,
        isReserve: row.is_reserve,
        players: [],
      });
    }
    if (row.player_id) map.get(row.team_id)!.players.push(row);
  }
  return Array.from(map.values());
}

interface RankingPlayer {
  id: string;
  name: string;
  photo: string | null;
  points: number;
}

function MatchRosterModal({
  token,
  point,
  onClose,
}: {
  token: string;
  point: PublicPoint | null;
  onClose: () => void;
}) {
  const { data: roster = [], isLoading } = useQuery({
    queryKey: ["public-match-roster", token, point?.match_id, point?.team_id],
    queryFn: () => getPublicMatchRoster(token, point!.match_id, point!.team_id),
    enabled: !!point,
  });

  return (
    <Dialog open={!!point} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <span className="mr-1.5">{point?.team_logo}</span>
            <span style={{ color: point?.team_color }}>{point?.team_name}</span>
          </DialogTitle>
          {point && (
            <p className="text-xs text-[var(--foreground-muted)]">
              Vitória em {formatDateTime(point.played_at)}
            </p>
          )}
        </DialogHeader>
        <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11 rounded-xl" />
            ))
          ) : roster.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)] text-center py-4">
              Nenhum jogador encontrado.
            </p>
          ) : (
            roster.map((player) => (
              <div key={player.player_id} className="flex items-center gap-2.5 px-1 py-1">
                <Avatar src={player.player_photo_url} name={player.player_name} size="sm" />
                <span className="text-sm text-[var(--foreground)] truncate">
                  {player.player_name}
                </span>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PlayerPointsModal({
  player,
  points,
  onClose,
  onSelectPoint,
}: {
  player: RankingPlayer | null;
  points: PublicPoint[];
  onClose: () => void;
  onSelectPoint: (point: PublicPoint) => void;
}) {
  const playerPoints = points
    .filter((p) => p.player_id === player?.id)
    .sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime());

  return (
    <Dialog open={!!player} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{player?.name}</DialogTitle>
          <p className="text-xs text-[var(--foreground-muted)]">
            {player?.points} {player?.points === 1 ? "ponto" : "pontos"}
          </p>
        </DialogHeader>
        <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto">
          {playerPoints.map((p, i) => (
            <button
              key={`${p.match_id}-${i}`}
              onClick={() => onSelectPoint(p)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left border border-[var(--border)] bg-[var(--background-secondary)] hover:border-emerald-500/40 transition-all"
            >
              <span className="text-lg">{p.team_logo}</span>
              <span
                className="text-sm font-medium flex-1 truncate"
                style={{ color: p.team_color }}
              >
                {p.team_name}
              </span>
              <span className="text-xs font-semibold text-emerald-400 shrink-0">+1</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PublicTournamentPage() {
  const { token } = useParams<{ token: string }>();
  const [selectedPlayer, setSelectedPlayer] = useState<RankingPlayer | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<PublicPoint | null>(null);

  const { data: tournament, isLoading: loadingTournament } = useQuery({
    queryKey: ["public-tournament", token],
    queryFn: () => getPublicTournament(token),
  });

  const { data: teamRows = [], isLoading: loadingTeams } = useQuery({
    queryKey: ["public-teams", token],
    queryFn: () => getPublicTeams(token),
  });

  const { data: points = [], isLoading: loadingPoints } = useQuery({
    queryKey: ["public-points", token],
    queryFn: () => getPublicPoints(token),
  });

  const teams = groupTeams(teamRows);

  const ranking: RankingPlayer[] = Array.from(
    points
      .reduce((acc, p) => {
        const entry = acc.get(p.player_id) ?? {
          id: p.player_id,
          name: p.player_name,
          photo: p.player_photo_url,
          points: 0,
        };
        entry.points += 1;
        acc.set(p.player_id, entry);
        return acc;
      }, new Map<string, RankingPlayer>())
      .values()
  ).sort((a, b) => b.points - a.points);

  const isLoading = loadingTournament || loadingTeams || loadingPoints;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-[var(--foreground-muted)]">Torneio não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)]">
          {tournament.name}
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-sm text-[var(--foreground-muted)]">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(tournament.date)}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-[var(--foreground-muted)]">
            <Users className="h-3.5 w-3.5" />
            {tournament.players_per_team} por time
          </span>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">Times</h2>
      {teams.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] border-dashed p-8 text-center mb-8">
          <Shield className="h-8 w-8 text-[var(--foreground-subtle)] mx-auto mb-2" />
          <p className="text-sm text-[var(--foreground-muted)]">
            Os times ainda não foram sorteados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: team.color + "40" }}
            >
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{ background: team.color + "15" }}
              >
                <span className="text-2xl">{team.logo}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[var(--foreground)] truncate">
                    {team.name}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    {team.players.length} jogadores
                  </p>
                </div>
              </div>
              <div className="px-3 py-2 bg-[var(--background-secondary)] flex flex-col gap-1.5">
                {team.players.map((player) => (
                  <div key={player.player_id} className="flex items-center gap-2.5">
                    <Avatar
                      src={player.player_photo_url}
                      name={player.player_name ?? ""}
                      size="sm"
                    />
                    <span className="text-sm text-[var(--foreground)] truncate flex-1">
                      {player.player_name}
                    </span>
                    {player.is_sub && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 shrink-0">
                        Sub
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Pontuação</h2>
        </div>
        {ranking.length === 0 ? (
          <p className="text-sm text-[var(--foreground-muted)]">
            Nenhuma vitória registrada ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {ranking.map((player, i) => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(player)}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 -mx-2 text-left hover:bg-[var(--background-tertiary)] transition-all"
              >
                <span className="text-xs text-[var(--foreground-muted)] w-4 shrink-0">
                  {i + 1}
                </span>
                <Avatar src={player.photo} name={player.name} size="sm" />
                <span className="text-sm text-[var(--foreground)] truncate flex-1">
                  {player.name}
                </span>
                <span className="text-sm font-semibold text-[var(--foreground)] shrink-0">
                  {player.points} {player.points === 1 ? "ponto" : "pontos"}
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      <PlayerPointsModal
        player={selectedPlayer}
        points={points}
        onClose={() => setSelectedPlayer(null)}
        onSelectPoint={setSelectedPoint}
      />
      <MatchRosterModal
        token={token}
        point={selectedPoint}
        onClose={() => setSelectedPoint(null)}
      />
    </div>
  );
}
