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
import { formatDate } from "@/lib/utils";
import type { Tournament } from "@/types";

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
            Novo torneio
          </Button>
        }
      />

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-5 py-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Nome</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Data</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Jogadores/time</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border-subtle)]">
                    <td className="px-5 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))
              : tournaments.length === 0
              ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-sm text-[var(--foreground-muted)]">
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
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-[var(--foreground-muted)]">
                      <Users className="h-3.5 w-3.5" />
                      {tournament.players_per_team} por time
                    </div>
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
