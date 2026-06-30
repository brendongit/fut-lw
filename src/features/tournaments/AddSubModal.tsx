"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { addSubToTeam } from "@/services/tournaments";
import type { Team } from "@/types";

interface AddSubModalProps {
  open: boolean;
  onClose: () => void;
  targetTeam: Team | null;
  allTeams: Team[];
  tournamentId: string;
}

export function AddSubModal({
  open,
  onClose,
  targetTeam,
  allTeams,
  tournamentId,
}: AddSubModalProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ playerId }: { playerId: string }) =>
      addSubToTeam(targetTeam!.id, playerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", tournamentId] });
      toast.success("Sub adicionado — ele permanece no time original");
    },
    onError: () => toast.error("Erro ao adicionar sub"),
  });

  const sourceteams = allTeams.filter((t) => t.id !== targetTeam?.id);
  const targetPlayerIds = new Set(targetTeam?.players?.map((p) => p.id) ?? []);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Adicionar sub para{" "}
            <span style={{ color: targetTeam?.color ?? "inherit" }}>
              {targetTeam?.name}
            </span>
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-[var(--foreground-muted)] -mt-2 mb-1">
          O jogador continua no time original e também joga como sub aqui.
        </p>

        <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
          {sourceteams.map((team) => {
            const available = (team.players ?? []).filter(
              (p) => !p.is_sub && !targetPlayerIds.has(p.id)
            );
            if (available.length === 0) return null;
            return (
              <div key={team.id}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base">{team.logo}</span>
                  <p
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: team.color }}
                  >
                    {team.name}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {available.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => mutation.mutate({ playerId: player.id })}
                      disabled={mutation.isPending}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-[var(--background-tertiary)] transition-all disabled:opacity-40"
                    >
                      <Avatar src={player.photo_url} name={player.name} size="sm" />
                      <span className="flex-1 text-sm font-medium text-[var(--foreground)]">
                        {player.name}
                      </span>
                      <span className="text-[10px] text-indigo-400 border border-indigo-500/30 rounded px-1.5 py-0.5">
                        + sub
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {sourceteams.every(
            (t) => (t.players ?? []).filter((p) => !p.is_sub && !targetPlayerIds.has(p.id)).length === 0
          ) && (
            <p className="text-center py-8 text-sm text-[var(--foreground-muted)]">
              Nenhum jogador disponível para sub
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
