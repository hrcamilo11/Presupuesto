import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionList } from "@/components/subscriptions/subscription-list";
import { SubscriptionFilter } from "@/components/subscriptions/subscription-filter";

export default async function SubscriptionsPage({
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
    .from("subscriptions")
    .select("*")
    .order("next_due_date", { ascending: true });

  if (filter === "next30") {
    const today = new Date().toISOString().slice(0, 10);
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    query = query.lte("next_due_date", in30).gte("next_due_date", today);
  } else if (filter === "overdue") {
    const today = new Date().toISOString().slice(0, 10);
    query = query.lt("next_due_date", today);
  }

  const { data: subscriptions } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Suscripciones</h1>
          <p className="text-muted-foreground">Control de gastos recurrentes (streaming, gym, etc.)</p>
        </div>
        <SubscriptionFilter currentFilter={filter} />
      </div>
      <SubscriptionList subscriptions={subscriptions ?? []} />
    </div>
  );
}
