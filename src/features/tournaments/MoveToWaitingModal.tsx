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
import { removePlayerFromTeam } from "@/services/tournaments";
import type { Team } from "@/types";

interface MoveToWaitingModalProps {
  open: boolean;
  onClose: () => void;
  teams: Team[];
  tournamentId: string;
}

export function MoveToWaitingModal({
  open,
  onClose,
  teams,
  tournamentId,
}: MoveToWaitingModalProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ teamId, playerId }: { teamId: string; playerId: string }) =>
      removePlayerFromTeam(teamId, playerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["waiting-players", tournamentId] });
      toast.success("Jogador movido para aguardando");
    },
    onError: () => toast.error("Erro ao mover jogador"),
  });

  const teamsWithPlayers = teams.filter((t) => (t.players?.length ?? 0) > 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mover jogador para aguardando</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-[var(--foreground-muted)] -mt-2 mb-1">
          Selecione um jogador de um time para colocá-lo na fila de espera.
        </p>

        <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
          {teamsWithPlayers.map((team) => (
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
                {team.players?.map((player) => (
                  <button
                    key={player.id}
                    onClick={() =>
                      mutation.mutate({ teamId: team.id, playerId: player.id })
                    }
                    disabled={mutation.isPending}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-[var(--background-tertiary)] transition-all disabled:opacity-40"
                  >
                    <Avatar src={player.photo_url} name={player.name} size="sm" />
                    <span className="flex-1 text-sm font-medium text-[var(--foreground)]">
                      {player.name}
                    </span>
                    <span className="text-[10px] text-[var(--foreground-muted)] border border-[var(--border)] rounded px-1.5 py-0.5">
                      mover
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {teamsWithPlayers.length === 0 && (
            <p className="text-center py-8 text-sm text-[var(--foreground-muted)]">
              Nenhum time formado
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
