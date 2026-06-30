"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Trophy, Swords, TrendingUp } from "lucide-react";
import { getDashboardStats } from "@/services/tournaments";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  const statCards = [
    {
      label: "Total de jogadores",
      value: stats?.totalPlayers ?? 0,
      icon: Users,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
    },
    {
      label: "Total de torneios",
      value: stats?.totalTournaments ?? 0,
      icon: Trophy,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Partidas realizadas",
      value: stats?.totalMatches ?? 0,
      icon: Swords,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral da sua pelada"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {statCards.map((card) => (
          <Card key={card.label} className="flex items-center gap-4">
            {isLoading ? (
              <>
                <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-7 w-12" />
                </div>
              </>
            ) : (
              <>
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${card.bg} shrink-0`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-xs text-[var(--foreground-muted)] font-medium">{card.label}</p>
                  <p className="text-3xl font-bold text-[var(--foreground)] mt-0.5">{card.value}</p>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>

      {/* Top 5 */}
      <Card className="max-w-lg">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Top 5 Vencedores</h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : !stats?.topPlayers?.length ? (
          <p className="text-sm text-[var(--foreground-muted)] text-center py-8">
            Nenhuma vitória registrada ainda
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {stats.topPlayers.map((player, i) => (
              <div
                key={player.id}
                className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-[var(--background-tertiary)] transition-colors"
              >
                <span className={`text-sm font-bold w-5 text-center ${
                  i === 0 ? "text-amber-400" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-[var(--foreground-muted)]"
                }`}>
                  {i + 1}
                </span>
                <Avatar src={player.photo_url} name={player.name} size="sm" />
                <span className="flex-1 text-sm font-medium text-[var(--foreground)] truncate">
                  {player.name}
                </span>
                <span className="text-sm font-semibold text-indigo-400">
                  {player.wins} {player.wins === 1 ? "vitória" : "vitórias"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
