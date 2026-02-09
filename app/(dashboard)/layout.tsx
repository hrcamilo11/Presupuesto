import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  LogOut,
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
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" className="font-semibold">
            Presupuesto
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/incomes">
                <TrendingUp className="mr-2 h-4 w-4" />
                Ingresos
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/expenses">
                <TrendingDown className="mr-2 h-4 w-4" />
                Gastos
              </Link>
            </Button>
            <form action="/auth/signout" method="POST">
              <Button type="submit" variant="ghost" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Salir
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1 container py-6 px-4">{children}</main>
    </div>
  );
}
