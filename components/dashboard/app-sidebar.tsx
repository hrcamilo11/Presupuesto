"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  History,
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  LogOut,
  Repeat,
  Landmark,
  Receipt,
  UsersRound,
  PiggyBank,
  Settings,
  X,
  Bell,
  LineChart,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  ChevronUp,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const financeItems = [
  { href: "/wallets", label: "Billeteras", icon: Wallet },
  { href: "/movements", label: "Movimientos", icon: History },
  { href: "/incomes", label: "Ingresos", icon: TrendingUp },
  { href: "/expenses", label: "Gastos", icon: TrendingDown },
  { href: "/cobros", label: "Cobros", icon: ArrowUpRight },
  { href: "/deudas", label: "Deudas", icon: ArrowDownLeft },
  { href: "/loans", label: "Préstamos", icon: Landmark },
] as const;

const planningItems = [
  { href: "/budgets", label: "Presupuestos", icon: Receipt },
  { href: "/savings", label: "Ahorros", icon: PiggyBank },
  { href: "/investments", label: "Inversiones", icon: LineChart },
  { href: "/taxes", label: "Impuestos", icon: Receipt },
  { href: "/subscriptions", label: "Suscripciones", icon: Repeat },
] as const;

const accountItems = [
  { href: "/shared", label: "Cuentas compartidas", icon: UsersRound },
  { href: "/friends", label: "Amigos", icon: Users },
  { href: "/notifications", label: "Notificaciones", icon: Bell },
  { href: "/settings", label: "Configuración", icon: Settings },
] as const;

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ isOpen = false, onClose }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-[env(safe-area-inset-top,0px)] z-50 flex h-[calc(100dvh-env(safe-area-inset-top,0px))] flex-col border-r bg-card shadow-sm transition-transform duration-300",
          "w-64",
          // Mobile: slide in/out
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold tracking-tight"
            onClick={onClose}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              P
            </span>
            <span className="truncate">Presupuesto</span>
          </Link>

          {/* Close button (mobile only) */}
          <button
            onClick={onClose}
            className="md:hidden rounded-lg p-2 hover:bg-accent"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
          <div>
            <Link
              href="/dashboard"
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === "/dashboard"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span>Dashboard</span>
            </Link>
          </div>

          <SidebarGroup label="Finanzas" items={financeItems} pathname={pathname || ""} onClose={onClose} />
          <SidebarGroup label="Planificación" items={planningItems} pathname={pathname || ""} onClose={onClose} />
          <SidebarGroup label="Cuenta" items={accountItems} pathname={pathname || ""} onClose={onClose} />
        </nav>

        {/* Logout */}
        <div className="border-t p-3">
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
              <span>Salir</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
function SidebarItem({ href, label, icon: Icon, pathname, onClose }: { href: string, label: string, icon: React.ElementType, pathname: string | null, onClose?: () => void }) {
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function SidebarGroup({
  label,
  items,
  pathname,
  onClose
}: {
  label: string,
  items: readonly any[],
  pathname: string,
  onClose?: () => void
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center justify-between hover:bg-accent/50 hover:text-foreground rounded-lg transition-colors mb-1"
      >
        <span>{label}</span>
        {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {isOpen && items.map((item) => (
        <SidebarItem key={item.href} {...item} pathname={pathname} onClose={onClose} />
      ))}
    </div>
  );
}
