"use client";

import { useState } from "react";
import { Trophy, Pencil, Check, ArrowRight, X, BanknoteCheck, BanknoteX } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Team } from "@/types";

interface TeamCardProps {
  team: Team;
  allTeams: Team[];
  paidAmountByPlayerId: Map<string, number | null>;
  onDeclareWinner: () => void;
  onMovePlayer: (playerId: string, toTeamId: string) => void;
  onRemoveFromTeam: (playerId: string) => void;
  onAddSubClick: () => void;
}

export function TeamCard({
  team,
  allTeams,
  paidAmountByPlayerId,
  onDeclareWinner,
  onMovePlayer,
  onRemoveFromTeam,
  onAddSubClick,
}: TeamCardProps) {
  const [editing, setEditing] = useState(false);
  const [movingPlayerId, setMovingPlayerId] = useState<string | null>(null);

  const otherTeams = allTeams.filter((t) => t.id !== team.id);
  const color = team.is_reserve ? "#f59e0b" : team.color;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: color + "40" }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ background: color + "15" }}
      >
        <span className="text-2xl">{team.logo}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[var(--foreground)] truncate">
            {team.name}
          </p>
          <p className="text-xs text-[var(--foreground-muted)]">
            {team.players?.length ?? 0} jogadores
          </p>
        </div>
        <button
          onClick={() => {
            setEditing((e) => !e);
            setMovingPlayerId(null);
          }}
          className={`rounded-lg p-1.5 transition-all ${
            editing
              ? "bg-indigo-500/20 text-indigo-400"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5"
          }`}
          title={editing ? "Fechar edição" : "Editar time"}
        >
          {editing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Players */}
      <div className="px-3 py-2 bg-[var(--background-secondary)] flex flex-col gap-1.5">
        {team.players?.map((player) => (
          <div key={player.id} className="flex items-center gap-2.5">
            <Avatar src={player.photo_url} name={player.name} size="sm" />
            <span className="text-sm text-[var(--foreground)] truncate flex-1">
              {player.name}
            </span>
            {paidAmountByPlayerId.has(player.id) ? (
              <span
                title={
                  paidAmountByPlayerId.get(player.id) != null
                    ? `Pago · ${formatCurrency(paidAmountByPlayerId.get(player.id)!)}`
                    : "Pago"
                }
                className="shrink-0 flex"
              >
                <BanknoteCheck className="h-3.5 w-3.5 text-emerald-400" />
              </span>
            ) : (
              <span title="Pendente" className="shrink-0 flex">
                <BanknoteX className="h-3.5 w-3.5 text-[var(--foreground-muted)]" />
              </span>
            )}
            {player.is_sub && !editing && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 shrink-0">
                Sub
              </span>
            )}
            {editing && (
              <div className="flex items-center gap-1 shrink-0">
                {movingPlayerId === player.id ? (
                  <>
                    <select
                      autoFocus
                      className="text-xs rounded-lg border border-[var(--border)] bg-[var(--background-tertiary)] text-[var(--foreground)] px-1.5 py-1 outline-none"
                      defaultValue=""
                      onChange={(e) => {
                        if (!e.target.value) return;
                        onMovePlayer(player.id, e.target.value);
                        setMovingPlayerId(null);
                      }}
                    >
                      <option value="" disabled>Mover para...</option>
                      {otherTeams.map((t) => (
                        <option key={t.id} value={t.id}>{t.logo} {t.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setMovingPlayerId(null)}
                      className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <>
                    {player.is_sub && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                        Sub
                      </span>
                    )}
                    <button
                      onClick={() => setMovingPlayerId(player.id)}
                      className="text-[var(--foreground-muted)] hover:text-indigo-400 transition-colors"
                      title="Mover para outro time"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onRemoveFromTeam(player.id)}
                      className="text-[var(--foreground-muted)] hover:text-red-400 transition-colors"
                      title="Remover do time"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {editing && (
          <button
            onClick={onAddSubClick}
            className="mt-1 flex items-center gap-2 rounded-xl border border-dashed border-indigo-500/30 px-3 py-2 text-xs text-indigo-400 hover:border-indigo-500/60 hover:bg-indigo-500/5 transition-all"
          >
            <span className="text-base leading-none">+</span>
            Adicionar sub de outro time
          </button>
        )}
      </div>

      {/* Footer */}
      {!editing && (
        <div
          className="px-3 py-2.5 border-t bg-[var(--background-secondary)]"
          style={{ borderColor: color + "30" }}
        >
          <Button
            size="sm"
            className="w-full gap-1.5"
            style={{
              background: color + "20",
              color,
              border: `1px solid ${color}40`,
            }}
            onClick={onDeclareWinner}
          >
            <Trophy className="h-3.5 w-3.5" />
            Vencedor
          </Button>
        </div>
      )}
    </div>
  );
}
