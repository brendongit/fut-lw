"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTournament,
  getTournamentPlayers,
  getTeams,
  getWaitingPlayers,
  removePlayerFromTournament,
  removeAllPlayersFromTournament,
  addAllPlayersToTournament,
  setPaid,
  drawTeams,
  resetTeams,
  declareWinner,
  formTeamFromWaiting,
  movePlayerBetweenTeams,
  removePlayerFromTeam,
} from "@/services/tournaments";
import { getPlayers } from "@/services/players";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AddPlayerModal } from "@/features/tournaments/AddPlayerModal";
import { AddSubModal } from "@/features/tournaments/AddSubModal";
import { TeamCard } from "@/features/tournaments/TeamCard";
import { toast } from "sonner";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Users, Calendar, Shuffle, Plus, X, Shield, RotateCcw, Check, Share2 } from "lucide-react";
import type { Team, TournamentPlayer } from "@/types";

function PlayerRow({
  tp,
  price,
  onSetPaid,
  onRemove,
}: {
  tp: TournamentPlayer;
  price: number | null;
  onSetPaid: (playerId: string, paid: boolean, amount: number | null) => void;
  onRemove: (playerId: string) => void;
}) {
  const [editingPaid, setEditingPaid] = useState(false);
  const [amountInput, setAmountInput] = useState(
    price != null ? String(price) : ""
  );

  function confirmPaid() {
    const amount = amountInput.trim() === "" ? null : Number(amountInput);
    onSetPaid(tp.player_id, true, amount);
    setEditingPaid(false);
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2.5">
      <Avatar src={tp.player?.photo_url} name={tp.player?.name ?? ""} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)] truncate">
          {tp.player?.name}
        </p>
      </div>

      {editingPaid ? (
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-[var(--foreground-muted)]">R$</span>
          <input
            autoFocus
            type="number"
            step="0.01"
            min="0"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmPaid()}
            className="w-16 text-xs rounded-lg border border-[var(--border)] bg-[var(--background-tertiary)] text-[var(--foreground)] px-1.5 py-1 outline-none focus:border-emerald-500/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button onClick={confirmPaid} className="text-emerald-400 hover:text-emerald-300">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setEditingPaid(false)}
            className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() =>
            tp.paid ? onSetPaid(tp.player_id, false, null) : setEditingPaid(true)
          }
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold border transition-all ${
            tp.paid
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : "bg-[var(--background-tertiary)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-emerald-500/30 hover:text-emerald-400/70"
          }`}
        >
          {tp.paid
            ? tp.amount_paid != null
              ? `Pago · ${formatCurrency(tp.amount_paid)}`
              : "Pago"
            : "Pendente"}
        </button>
      )}

      <button
        onClick={() => onRemove(tp.player_id)}
        className="text-[var(--foreground-muted)] hover:text-red-400 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [addSubFor, setAddSubFor] = useState<Team | null>(null);
  const [winnerConfirm, setWinnerConfirm] = useState<Team | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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

  const { data: waitingPlayers = [] } = useQuery({
    queryKey: ["waiting-players", id],
    queryFn: () => getWaitingPlayers(id),
    enabled: teams.length > 0,
  });

  const removeMutation = useMutation({
    mutationFn: ({ playerId }: { playerId: string }) =>
      removePlayerFromTournament(id, playerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-players", id] });
      toast.success("Jogador removido");
    },
  });

  const paidMutation = useMutation({
    mutationFn: ({
      playerId,
      paid,
      amount,
    }: {
      playerId: string;
      paid: boolean;
      amount?: number | null;
    }) => setPaid(id, playerId, paid, amount),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["tournament-players", id] }),
    onError: (e: Error) => toast.error(`Erro ao salvar pagamento: ${e.message}`),
  });

  const addAllMutation = useMutation({
    mutationFn: () => addAllPlayersToTournament(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-players", id] });
      toast.success("Todos os jogadores adicionados");
    },
    onError: () => toast.error("Erro ao adicionar jogadores"),
  });

  const clearAllMutation = useMutation({
    mutationFn: () => removeAllPlayersFromTournament(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-players", id] });
      queryClient.invalidateQueries({ queryKey: ["teams", id] });
      toast.success("Jogadores removidos");
    },
    onError: () => toast.error("Erro ao limpar jogadores"),
  });

  const drawMutation = useMutation({
    mutationFn: () => drawTeams(id, tournament!.players_per_team),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", id] });
      queryClient.invalidateQueries({ queryKey: ["waiting-players", id] });
      toast.success("Times sorteados!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetTeams(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", id] });
      queryClient.invalidateQueries({ queryKey: ["waiting-players", id] });
      queryClient.invalidateQueries({ queryKey: ["tournament-players", id] });
      toast.success("Times zerados");
      setShowResetConfirm(false);
    },
    onError: () => toast.error("Erro ao zerar times"),
  });

  const formTeamMutation = useMutation({
    mutationFn: () => formTeamFromWaiting(id, tournament!.players_per_team),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", id] });
      queryClient.invalidateQueries({ queryKey: ["waiting-players", id] });
      toast.success("Time formado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const movePlayerMutation = useMutation({
    mutationFn: ({ playerId, fromTeamId, toTeamId }: { playerId: string; fromTeamId: string; toTeamId: string }) =>
      movePlayerBetweenTeams(fromTeamId, toTeamId, playerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", id] });
      queryClient.invalidateQueries({ queryKey: ["waiting-players", id] });
      toast.success("Jogador movido");
    },
    onError: () => toast.error("Erro ao mover jogador"),
  });

  const removeFromTeamMutation = useMutation({
    mutationFn: ({ playerId, teamId }: { playerId: string; teamId: string }) =>
      removePlayerFromTeam(teamId, playerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", id] });
      queryClient.invalidateQueries({ queryKey: ["waiting-players", id] });
      toast.success("Jogador removido do time");
    },
    onError: () => toast.error("Erro ao remover do time"),
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

  const addedPlayerIds = new Set(tournamentPlayers.map((tp) => tp.player_id));
  const sortedTournamentPlayers = [...tournamentPlayers].sort((a, b) =>
    (a.player?.name ?? "").localeCompare(b.player?.name ?? "")
  );
  const paidPlayers = tournamentPlayers.filter((tp) => tp.paid);
  const paidAmountByPlayerId = new Map(
    paidPlayers.map((tp) => [tp.player_id, tp.amount_paid])
  );
  const totalCollected = paidPlayers.reduce(
    (sum, tp) => sum + (tp.amount_paid ?? 0),
    0
  );

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
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
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
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                const url = `${window.location.origin}/t/${tournament.share_token}`;
                navigator.clipboard.writeText(url);
                toast.success("Link público copiado!");
              }}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Compartilhar</span>
            </Button>
            {teams.length > 0 && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setShowResetConfirm(true)}
                className="gap-2 text-red-400 hover:text-red-300 hover:border-red-500/30"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Zerar times</span>
              </Button>
            )}
            <Button
              onClick={() => drawMutation.mutate()}
              loading={drawMutation.isPending}
              size="lg"
              className="gap-2 shadow-lg shadow-indigo-500/20 flex-1 sm:flex-none"
            >
              <Shuffle className="h-5 w-5" />
              Sortear Times
            </Button>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="p-3 sm:p-4">
          <p className="text-xs text-[var(--foreground-muted)] font-medium">Inscritos</p>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{tournamentPlayers.length}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs text-[var(--foreground-muted)] font-medium">Times</p>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{teams.length}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs text-[var(--foreground-muted)] font-medium">Arrecadado</p>
          <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
            {formatCurrency(totalCollected)}
          </p>
          <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
            {paidPlayers.length}/{tournamentPlayers.length} pagos
          </p>
        </Card>
      </div>

      {/* Players + Teams */}
      <div className="flex flex-col lg:grid lg:grid-cols-5 gap-6">
        {/* Players list */}
        <div className={`${teams.length > 0 ? "order-2" : "order-1"} lg:order-0 lg:col-span-2`}>
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Jogadores ({tournamentPlayers.length})
            </h2>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {tournamentPlayers.length > 0 && (
                <button
                  onClick={() => clearAllMutation.mutate()}
                  disabled={clearAllMutation.isPending}
                  className="rounded-full px-2.5 py-1 text-[10px] font-semibold border transition-all disabled:opacity-40 bg-[var(--background-tertiary)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-red-500/40 hover:text-red-400"
                >
                  Limpar todos
                </button>
              )}
              <button
                onClick={() => addAllMutation.mutate()}
                disabled={addAllMutation.isPending}
                className="rounded-full px-2.5 py-1 text-[10px] font-semibold border transition-all disabled:opacity-40 bg-[var(--background-tertiary)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-indigo-500/40 hover:text-indigo-400"
              >
                Adicionar todos
              </button>
              <Button size="sm" variant="secondary" onClick={() => setShowAddPlayer(true)}>
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
            </div>
          </div>

          {loadingPlayers ? (
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : tournamentPlayers.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] border-dashed p-8 text-center">
              <p className="text-sm text-[var(--foreground-muted)]">
                Adicione jogadores ao torneio
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {sortedTournamentPlayers.map((tp) => (
                <PlayerRow
                  key={tp.player_id}
                  tp={tp}
                  price={tournament.price}
                  onSetPaid={(playerId, paid, amount) =>
                    paidMutation.mutate({ playerId, paid, amount })
                  }
                  onRemove={(playerId) => removeMutation.mutate({ playerId })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Teams */}
        <div className={`${teams.length > 0 ? "order-1" : "order-2"} lg:order-0 lg:col-span-3`}>
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">
            Times {teams.length > 0 && `(${teams.length})`}
          </h2>

          {loadingTeams ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] border-dashed p-12 text-center flex flex-col items-center gap-3">
              <Shield className="h-10 w-10 text-[var(--foreground-subtle)]" />
              <p className="text-sm text-[var(--foreground-muted)]">
                Adicione jogadores e clique em{" "}
                <span className="font-medium text-[var(--foreground)]">Sortear Times</span>
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    allTeams={teams}
                    paidAmountByPlayerId={paidAmountByPlayerId}
                    onDeclareWinner={() => setWinnerConfirm(team)}
                    onMovePlayer={(playerId, toTeamId) =>
                      movePlayerMutation.mutate({ playerId, fromTeamId: team.id, toTeamId })
                    }
                    onRemoveFromTeam={(playerId) =>
                      removeFromTeamMutation.mutate({ playerId, teamId: team.id })
                    }
                    onAddSubClick={() => setAddSubFor(team)}
                  />
                ))}
              </div>

              {waitingPlayers.length > 0 && (
                <div className="mt-4 rounded-2xl border border-amber-500/25 bg-[var(--background-secondary)] p-4">
                  <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                      Aguardando ({waitingPlayers.length}/{tournament.players_per_team})
                    </p>
                    <Button
                      size="sm"
                      onClick={() => formTeamMutation.mutate()}
                      loading={formTeamMutation.isPending}
                      className="gap-1.5 shadow-sm shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 text-white border-0"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      Formar time
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {waitingPlayers.map((tp) => (
                      <div
                        key={tp.player_id}
                        className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5"
                      >
                        <Avatar src={tp.player?.photo_url} name={tp.player?.name ?? ""} size="sm" />
                        <span className="text-xs font-medium text-[var(--foreground)]">{tp.player?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
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

      <AddSubModal
        open={!!addSubFor}
        onClose={() => setAddSubFor(null)}
        targetTeam={addSubFor}
        allTeams={teams}
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

      <ConfirmDialog
        open={showResetConfirm}
        title="Zerar times?"
        description="Todos os times formados serão removidos. Os jogadores voltam para a lista e você pode sortear novamente."
        onConfirm={() => resetMutation.mutate()}
        onCancel={() => setShowResetConfirm(false)}
        loading={resetMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
