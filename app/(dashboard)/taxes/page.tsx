import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TaxList } from "@/components/taxes/tax-list";

export default async function TaxesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: taxes } = await supabase
    .from("tax_obligations")
    .select("*")
    .order("due_date", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Impuestos</h1>
        <p className="text-muted-foreground">Obligaciones fiscales: ISR, IVA, predial, declaraciones. Fechas de vencimiento y estado de pago.</p>
      </div>
      <TaxList taxes={taxes ?? []} />
    </div>
  );
}
