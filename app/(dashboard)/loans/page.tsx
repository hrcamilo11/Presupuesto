import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoanCard } from "@/components/loans/loan-card";
import { LoansAddButton } from "@/components/loans/loans-add-button";
import { DashboardContextSelector } from "@/components/dashboard/dashboard-context-selector";
import { getWallets } from "@/app/actions/wallets";
import { getMySharedAccounts } from "@/app/actions/shared-accounts";

type SearchParams = { context?: string };

export default async function LoansPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const context = params.context;

  let loansQuery = supabase.from("loans").select("*").order("created_at", { ascending: false });
  if (context === "personal") {
    loansQuery = loansQuery.is("shared_account_id", null);
  } else if (context && context !== "global") {
    loansQuery = loansQuery.eq("shared_account_id", context);
  }

  const [{ data: loans }, { data: allPayments }, { data: wallets }, { data: sharedAccounts }] = await Promise.all([
    loansQuery,
    (async () => {
      const { data: innerLoans } = await supabase
        .from("loans")
        .select("id");
      const loanIds = (innerLoans ?? []).map((l) => l.id);
      if (!loanIds.length) {
        return { data: [] as { loan_id: string; payment_number: number }[] };
      }
      const { data } = await supabase
        .from("loan_payments")
        .select("*")
        .in("loan_id", loanIds);
      return { data: data ?? [] };
    })(),
    getWallets(),
    getMySharedAccounts(),
  ]);

  const paymentsByLoan = (allPayments ?? []).reduce<Record<string, typeof allPayments>>((acc, p) => {
    const id = p.loan_id;
    if (!acc[id]) acc[id] = [];
    acc[id].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Préstamos</h1>
          <p className="text-muted-foreground">Préstamos personales, auto, hipoteca: tabla de amortización y registro de pagos</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DashboardContextSelector sharedAccounts={sharedAccounts ?? []} />
          <LoansAddButton />
        </div>
      </div>
      {!loans?.length ? (
        <p className="text-muted-foreground py-8 text-center">No hay préstamos. Agrega uno para ver la tabla de amortización y registrar pagos.</p>
      ) : (
        <div className="grid gap-4">
          {loans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              payments={(paymentsByLoan[loan.id] ?? []).sort(
                (a, b) => a.payment_number - b.payment_number,
              )}
              wallets={wallets}
            />
          ))}
        </div>
      )}
    </div>
  );
}
