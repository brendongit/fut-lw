"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, Users, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { getTournaments, deleteTournament } from "@/services/tournaments";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { TournamentDialog } from "@/features/tournaments/TournamentDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatDate, daysUntil } from "@/lib/utils";

function DaysChip({ date }: { date: string }) {
  const days = daysUntil(date);

  if (days < 0)
    return (
      <span className="inline-flex items-center rounded-lg bg-[var(--background-tertiary)] border border-[var(--border)] px-2 py-0.5 text-xs font-medium text-[var(--foreground-muted)]">
        Realizado
      </span>
    );

  if (days === 0)
    return (
      <span className="inline-flex items-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
        Hoje
      </span>
    );

  if (days <= 7)
    return (
      <span className="inline-flex items-center rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
        {days}d
      </span>
    );

  return (
    <span className="inline-flex items-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-400">
      {days}d
    </span>
  );
}

export default function TournamentsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: getTournaments,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTournament,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Torneio removido");
      setDeleteId(null);
    },
    onError: () => toast.error("Erro ao remover torneio"),
  });

  return (
    <div>
      <PageHeader
        title="Torneios"
        description={`${tournaments.length} torneios criados`}
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo torneio</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        }
      />

      {/* Mobile card list */}
      <div className="sm:hidden flex flex-col gap-2">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))
          : tournaments.length === 0
          ? (
            <p className="text-center py-12 text-sm text-[var(--foreground-muted)]">
              Nenhum torneio criado
            </p>
          )
          : tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-medium text-sm text-[var(--foreground)]">
                    {tournament.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(tournament.id)}
                    className="hover:text-red-400 shrink-0 -mt-1 -mr-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]">
                    <Calendar className="h-3 w-3" />
                    {formatDate(tournament.date)}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]">
                    <Users className="h-3 w-3" />
                    {tournament.players_per_team} por time
                  </span>
                  <DaysChip date={tournament.date} />
                </div>
                <Link
                  href={`/tournaments/${tournament.id}`}
                  className="flex items-center justify-center gap-1.5 h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--background-tertiary)] text-xs font-medium text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
                >
                  Abrir torneio
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left px-5 py-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Nome</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Data</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide hidden md:table-cell">Jogadores/time</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--border-subtle)]">
                      <td className="px-5 py-4"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-5 py-4 hidden md:table-cell"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-5 w-16 rounded-lg" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-8 w-20 ml-auto" /></td>
                    </tr>
                  ))
                : tournaments.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-sm text-[var(--foreground-muted)]">
                      Nenhum torneio criado
                    </td>
                  </tr>
                )
                : tournaments.map((tournament) => (
                  <tr
                    key={tournament.id}
                    className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--background-tertiary)] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <span className="font-medium text-sm text-[var(--foreground)]">
                        {tournament.name}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-[var(--foreground-muted)]">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(tournament.date)}
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-[var(--foreground-muted)]">
                        <Users className="h-3.5 w-3.5" />
                        {tournament.players_per_team} por time
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <DaysChip date={tournament.date} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(tournament.id)}
                          className="hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="secondary" size="sm" asChild>
                          <Link href={`/tournaments/${tournament.id}`}>
                            Abrir
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <TournamentDialog open={showCreate} onClose={() => setShowCreate(false)} />

      <ConfirmDialog
        open={!!deleteId}
        title="Remover torneio"
        description="Tem certeza? Todos os dados do torneio serão perdidos."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
