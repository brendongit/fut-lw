"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Phone, Trophy } from "lucide-react";
import { toast } from "sonner";
import { getPlayers, deletePlayer } from "@/services/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlayerDialog } from "@/features/players/PlayerDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { Player } from "@/types";

export default function PlayersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: players = [], isLoading } = useQuery({
    queryKey: ["players"],
    queryFn: getPlayers,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePlayer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      toast.success("Jogador removido");
      setDeleteId(null);
    },
    onError: () => toast.error("Erro ao remover jogador"),
  });

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Jogadores"
        description={`${players.length} jogadores cadastrados`}
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Novo jogador
          </Button>
        }
      />

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)]" />
        <input
          placeholder="Pesquisar jogadores..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-5 py-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Jogador</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Telefone</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Vitórias</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border-subtle)]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </td>
                    <td className="px-5 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-3"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-5 py-3"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              : filtered.length === 0
              ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-sm text-[var(--foreground-muted)]">
                    {search ? "Nenhum jogador encontrado" : "Nenhum jogador cadastrado"}
                  </td>
                </tr>
              )
              : filtered.map((player) => (
                <tr
                  key={player.id}
                  className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--background-tertiary)] transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={player.photo_url} name={player.name} />
                      <span className="font-medium text-sm text-[var(--foreground)]">{player.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {player.phone ? (
                      <div className="flex items-center gap-1.5 text-sm text-[var(--foreground-muted)]">
                        <Phone className="h-3.5 w-3.5" />
                        {player.phone}
                      </div>
                    ) : (
                      <span className="text-sm text-[var(--foreground-subtle)]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)]">
                      <Trophy className="h-3.5 w-3.5 text-amber-400" />
                      {player.wins}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditPlayer(player)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(player.id)}
                        className="hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <PlayerDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />

      {editPlayer && (
        <PlayerDialog
          open={!!editPlayer}
          player={editPlayer}
          onClose={() => setEditPlayer(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Remover jogador"
        description="Tem certeza que deseja remover este jogador? Esta ação não pode ser desfeita."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
