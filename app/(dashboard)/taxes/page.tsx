import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TaxList } from "@/components/taxes/tax-list";
import { TaxesAddButton } from "@/components/taxes/taxes-add-button";
import { TaxFilter } from "@/components/taxes/tax-filter";
import { getWallets } from "@/app/actions/wallets";

export default async function TaxesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const filter = params.filter ?? "all";

  let query = supabase
    .from("tax_obligations")
    .select("*")
    .order("due_date", { ascending: true });

  if (filter === "pending") {
    query = query.is("paid_at", null);
  } else if (filter === "overdue") {
    const today = new Date().toISOString().slice(0, 10);
    query = query.is("paid_at", null).lt("due_date", today);
  }

  const { data: taxes } = await query;
  const { data: wallets } = await getWallets();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-2xl font-bold">Impuestos</h1>
            <p className="text-muted-foreground">Obligaciones fiscales: ISR, IVA, predial, declaraciones. Fechas de vencimiento y estado de pago.</p>
          </div>
          <TaxesAddButton />
        </div>
        <TaxFilter currentFilter={filter} />
      </div>
      <TaxList taxes={taxes ?? []} wallets={wallets ?? []} />
    </div>
  );
}
