import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionList } from "@/components/subscriptions/subscription-list";

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*")
    .order("next_due_date", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suscripciones</h1>
        <p className="text-muted-foreground">Control de gastos recurrentes (streaming, gym, etc.)</p>
      </div>
      <SubscriptionList subscriptions={subscriptions ?? []} />
    </div>
  );
}
