import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SharedAccountsList } from "@/components/shared/shared-accounts-list";
import { getMySharedAccounts } from "@/app/actions/shared-accounts";

export default async function SharedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: accounts } = await getMySharedAccounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Cuentas compartidas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crea una cuenta compartida e invita a otros. Todos podrán añadir ingresos, gastos y más.
        </p>
      </div>
      <SharedAccountsList initialAccounts={accounts ?? []} />
    </div>
  );
}
