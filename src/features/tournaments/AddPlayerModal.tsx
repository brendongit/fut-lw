"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { addPlayerToTournament } from "@/services/tournaments";
import type { Player } from "@/types";

interface AddPlayerModalProps {
  open: boolean;
  onClose: () => void;
  allPlayers: Player[];
  addedPlayerIds: Set<string>;
  tournamentId: string;
}

export function AddPlayerModal({
  open,
  onClose,
  allPlayers,
  addedPlayerIds,
  tournamentId,
}: AddPlayerModalProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const mutation = useMutation({
    mutationFn: (playerId: string) =>
      addPlayerToTournament(tournamentId, playerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-players", tournamentId] });
      toast.success("Jogador adicionado");
    },
    onError: () => toast.error("Erro ao adicionar jogador"),
  });

  const filtered = allPlayers.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar jogador</DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)]" />
          <input
            autoFocus
            placeholder="Pesquisar jogadores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--background-tertiary)] pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] outline-none focus:border-indigo-500/60 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-sm text-[var(--foreground-muted)]">
              Nenhum jogador encontrado
            </p>
          ) : (
            filtered.map((player) => {
              const added = addedPlayerIds.has(player.id);
              return (
                <button
                  key={player.id}
                  onClick={() => !added && mutation.mutate(player.id)}
                  disabled={added}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                    added
                      ? "opacity-50 cursor-default"
                      : "hover:bg-[var(--background-tertiary)] cursor-pointer"
                  }`}
                >
                  <Avatar src={player.photo_url} name={player.name} size="sm" />
                  <span className="flex-1 text-sm font-medium text-[var(--foreground)]">
                    {player.name}
                  </span>
                  {added ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <UserPlus className="h-4 w-4 text-[var(--foreground-muted)]" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
