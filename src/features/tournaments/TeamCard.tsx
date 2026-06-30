"use client";

import { Trophy } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Team } from "@/types";

interface TeamCardProps {
  team: Team;
  onDeclareWinner: () => void;
}

export function TeamCard({ team, onDeclareWinner }: TeamCardProps) {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: team.color + "40" }}
    >
      {/* Header */}
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
            {team.players?.length ?? 0} jogadores
          </p>
        </div>
      </div>

      {/* Players */}
      <div className="px-3 py-2 bg-[var(--background-secondary)] flex flex-col gap-1.5">
        {team.players?.map((player) => (
          <div key={player.id} className="flex items-center gap-2.5">
            <Avatar src={player.photo_url} name={player.name} size="sm" />
            <span className="text-sm text-[var(--foreground)] truncate">
              {player.name}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 border-t bg-[var(--background-secondary)]" style={{ borderColor: team.color + "30" }}>
        <Button
          size="sm"
          className="w-full gap-1.5"
          style={{
            background: team.color + "20",
            color: team.color,
            border: `1px solid ${team.color}40`,
          }}
          onClick={onDeclareWinner}
        >
          <Trophy className="h-3.5 w-3.5" />
          Vencedor
        </Button>
      </div>
    </div>
  );
}
