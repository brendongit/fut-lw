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

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 w-60 hidden lg:flex flex-col border-r border-[var(--border)] bg-[var(--background-secondary)]">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[var(--border)]">
          <div className="h-8 w-8 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white text-base">⚽</span>
          </div>
          <span className="font-semibold text-[var(--foreground)] text-sm">Fut Manager</span>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive(href)
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)] hover:text-[var(--foreground)]"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive(href) && "text-indigo-400")} />
              {label}
            </Link>
          ))}
        </nav>

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

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-500 flex items-center justify-center">
            <span className="text-white text-sm">⚽</span>
          </div>
          <span className="font-semibold text-[var(--foreground)] text-sm">Fut Manager</span>
        </div>
        <button
          onClick={handleSignOut}
          className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-red-400 hover:bg-[var(--background-tertiary)] transition-all"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-[var(--border)] bg-[var(--background-secondary)]">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-all",
              isActive(href)
                ? "text-indigo-400"
                : "text-[var(--foreground-muted)]"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
