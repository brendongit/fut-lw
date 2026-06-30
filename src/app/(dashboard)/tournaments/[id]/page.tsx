"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTournament,
  getTournamentPlayers,
  getTeams,
  removePlayerFromTournament,
  setSubstitute,
  drawTeams,
  declareWinner,
} from "@/services/tournaments";
import { getPlayers } from "@/services/players";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AddPlayerModal } from "@/features/tournaments/AddPlayerModal";
import { TeamCard } from "@/features/tournaments/TeamCard";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import {
  Users,
  Calendar,
  Trophy,
  Shuffle,
  Plus,
  X,
  Shield,
} from "lucide-react";
import type { Team } from "@/types";

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [winnerConfirm, setWinnerConfirm] = useState<Team | null>(null);

  const { data: tournament, isLoading: loadingTournament } = useQuery({
    queryKey: ["tournament", id],
    queryFn: () => getTournament(id),
  });

  const { data: tournamentPlayers = [], isLoading: loadingPlayers } = useQuery({
    queryKey: ["tournament-players", id],
    queryFn: () => getTournamentPlayers(id),
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ["players"],
    queryFn: getPlayers,
  });

  const { data: teams = [], isLoading: loadingTeams } = useQuery({
    queryKey: ["teams", id],
    queryFn: () => getTeams(id),
  });

  const removeMutation = useMutation({
    mutationFn: ({ playerId }: { playerId: string }) =>
      removePlayerFromTournament(id, playerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-players", id] });
      toast.success("Jogador removido");
    },
  });

  const substituteMutation = useMutation({
    mutationFn: ({
      playerId,
      isSub,
    }: {
      playerId: string;
      isSub: boolean;
    }) => setSubstitute(id, playerId, isSub),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["tournament-players", id] }),
  });

  const drawMutation = useMutation({
    mutationFn: () => drawTeams(id, tournament!.players_per_team),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", id] });
      toast.success("Times sorteados!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const winnerMutation = useMutation({
    mutationFn: (teamId: string) => declareWinner(id, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success("Vencedor registrado! Vitórias atualizadas.");
      setWinnerConfirm(null);
    },
    onError: () => toast.error("Erro ao registrar vencedor"),
  });

  const activePlayers = tournamentPlayers.filter((tp) => !tp.is_substitute);
  const substitutes = tournamentPlayers.filter((tp) => tp.is_substitute);
  const addedPlayerIds = new Set(tournamentPlayers.map((tp) => tp.player_id));

  if (loadingTournament) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!tournament) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">
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
          <Button
            onClick={() => drawMutation.mutate()}
            loading={drawMutation.isPending}
            size="lg"
            className="gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Shuffle className="h-5 w-5" />
            Sortear Times
          </Button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <p className="text-xs text-[var(--foreground-muted)] font-medium">Inscritos</p>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
            {activePlayers.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--foreground-muted)] font-medium">Substitutos</p>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
            {substitutes.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--foreground-muted)] font-medium">Times</p>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
            {teams.length}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Players list */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Jogadores ({tournamentPlayers.length})
            </h2>
            <Button size="sm" variant="secondary" onClick={() => setShowAddPlayer(true)}>
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            {loadingPlayers
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))
              : tournamentPlayers.length === 0
              ? (
                <div className="rounded-2xl border border-[var(--border)] border-dashed p-8 text-center">
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Adicione jogadores ao torneio
                  </p>
                </div>
              )
              : tournamentPlayers.map((tp) => (
                  <div
                    key={tp.player_id}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2.5 hover:border-[var(--border-subtle)] transition-all"
                  >
                    <Avatar
                      src={tp.player?.photo_url}
                      name={tp.player?.name ?? ""}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">
                        {tp.player?.name}
                      </p>
                      {tp.is_substitute && (
                        <Badge variant="warning" className="text-[10px] py-0">
                          Substituto
                        </Badge>
                      )}
                    </div>

                    {/* Substitute toggle */}
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors shrink-0">
                      <input
                        type="checkbox"
                        checked={tp.is_substitute}
                        onChange={(e) =>
                          substituteMutation.mutate({
                            playerId: tp.player_id,
                            isSub: e.target.checked,
                          })
                        }
                        className="accent-indigo-500 h-3.5 w-3.5"
                      />
                      Sub
                    </label>

                    <button
                      onClick={() => removeMutation.mutate({ playerId: tp.player_id })}
                      className="text-[var(--foreground-muted)] hover:text-red-400 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
          </div>
        </div>

        {/* Teams */}
        <div className="col-span-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">
            Times {teams.length > 0 && `(${teams.length})`}
          </h2>

          {loadingTeams ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] border-dashed p-12 text-center flex flex-col items-center gap-3">
              <Shield className="h-10 w-10 text-[var(--foreground-subtle)]" />
              <p className="text-sm text-[var(--foreground-muted)]">
                Adicione jogadores e clique em{" "}
                <span className="font-medium text-[var(--foreground)]">
                  Sortear Times
                </span>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onDeclareWinner={() => setWinnerConfirm(team)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddPlayerModal
        open={showAddPlayer}
        onClose={() => setShowAddPlayer(false)}
        allPlayers={allPlayers}
        addedPlayerIds={addedPlayerIds}
        tournamentId={id}
      />

      <ConfirmDialog
        open={!!winnerConfirm}
        title={`${winnerConfirm?.name} é o vencedor?`}
        description="Todos os jogadores deste time receberão +1 vitória. Esta ação não pode ser desfeita."
        onConfirm={() => winnerConfirm && winnerMutation.mutate(winnerConfirm.id)}
        onCancel={() => setWinnerConfirm(null)}
        loading={winnerMutation.isPending}
      />
    </div>
  );
}
