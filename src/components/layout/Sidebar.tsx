"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Trophy, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/players", label: "Jogadores", icon: Users },
  { href: "/tournaments", label: "Torneios", icon: Trophy },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 flex flex-col border-r border-[var(--border)] bg-[var(--background-secondary)]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[var(--border)]">
        <div className="h-8 w-8 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <span className="text-white text-base">⚽</span>
        </div>
        <span className="font-semibold text-[var(--foreground)] text-sm">Fut Manager</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)]"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-indigo-400" : "")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--border)]">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] hover:text-red-400 transition-all duration-150"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
