"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  LogOut,
  Repeat,
  Landmark,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/incomes", label: "Ingresos", icon: TrendingUp },
  { href: "/expenses", label: "Gastos", icon: TrendingDown },
  { href: "/subscriptions", label: "Suscripciones", icon: Repeat },
  { href: "/loans", label: "Préstamos", icon: Landmark },
  { href: "/taxes", label: "Impuestos", icon: Receipt },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card shadow-sm",
        "w-16 md:w-56"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center border-b px-3 md:px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            P
          </span>
          <span className="hidden truncate md:inline">Presupuesto</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 md:p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden truncate md:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t p-2 md:p-3">
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="hidden md:inline">Salir</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
