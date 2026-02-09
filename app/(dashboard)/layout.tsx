import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  LogOut,
  Repeat,
  Landmark,
  Receipt,
} from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm shadow-sm">
        <div className="container max-w-7xl flex h-14 items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight sm:text-lg">
            <span className="rounded-lg bg-primary px-2 py-0.5 text-primary-foreground text-sm font-bold">P</span>
            <span className="hidden sm:inline">Presupuesto</span>
          </Link>
          <nav className="flex min-w-0 flex-1 items-center justify-end gap-0.5 overflow-x-auto py-2 scrollbar-none sm:justify-end sm:gap-1">
            <Button variant="ghost" size="sm" asChild className="shrink-0 px-2 sm:px-3">
              <Link href="/dashboard" className="flex items-center gap-1.5" aria-label="Dashboard">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden md:inline">Dashboard</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="shrink-0 px-2 sm:px-3">
              <Link href="/incomes" className="flex items-center gap-1.5" aria-label="Ingresos">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden md:inline">Ingresos</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="shrink-0 px-2 sm:px-3">
              <Link href="/expenses" className="flex items-center gap-1.5" aria-label="Gastos">
                <TrendingDown className="h-4 w-4" />
                <span className="hidden md:inline">Gastos</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="shrink-0 px-2 sm:px-3">
              <Link href="/subscriptions" className="flex items-center gap-1.5" aria-label="Suscripciones">
                <Repeat className="h-4 w-4" />
                <span className="hidden lg:inline">Suscripciones</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="shrink-0 px-2 sm:px-3">
              <Link href="/loans" className="flex items-center gap-1.5" aria-label="Préstamos">
                <Landmark className="h-4 w-4" />
                <span className="hidden lg:inline">Préstamos</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="shrink-0 px-2 sm:px-3">
              <Link href="/taxes" className="flex items-center gap-1.5" aria-label="Impuestos">
                <Receipt className="h-4 w-4" />
                <span className="hidden lg:inline">Impuestos</span>
              </Link>
            </Button>
            <div className="ml-1 h-6 w-px shrink-0 bg-border sm:ml-2" aria-hidden />
            <form action="/auth/signout" method="POST" className="shrink-0">
              <Button type="submit" variant="ghost" size="sm" className="px-2 sm:px-3">
                <LogOut className="h-4 w-4 md:mr-0" />
                <span className="hidden md:inline md:ml-1.5">Salir</span>
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1 container max-w-7xl py-4 px-4 sm:py-6 sm:px-6 lg:py-8 lg:px-8">{children}</main>
    </div>
  );
}
