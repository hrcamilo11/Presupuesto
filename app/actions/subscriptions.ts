"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SubscriptionFrequency } from "@/lib/database.types";
import { subscriptionSchema } from "@/lib/validations/subscription";

function nextDueFromFrequency(nextDue: string, frequency: SubscriptionFrequency): string {
  const d = new Date(nextDue);
  if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export async function createSubscription(formData: {
  name: string;
  amount: number;
  currency: string;
  frequency: SubscriptionFrequency;
  next_due_date: string;
  description?: string;
}) {
  const parsed = subscriptionSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase.from("subscriptions").insert({
    user_id: user.id,
    ...parsed.data,
    description: parsed.data.description || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateSubscription(
  id: string,
  formData: { name: string; amount: number; currency: string; frequency: SubscriptionFrequency; next_due_date: string; description?: string }
) {
  const parsed = subscriptionSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("subscriptions")
    .update({ ...parsed.data, description: parsed.data.description || null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteSubscription(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const { error } = await supabase.from("subscriptions").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
  return { error: null };
}

/** Marca la suscripción como pagada y avanza next_due_date. */
export async function markSubscriptionPaid(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const { data: sub } = await supabase.from("subscriptions").select("next_due_date, frequency").eq("id", id).eq("user_id", user.id).single();
  if (!sub) return { error: "Suscripción no encontrada" };
  const next = nextDueFromFrequency(sub.next_due_date, sub.frequency as SubscriptionFrequency);
  const { error } = await supabase
    .from("subscriptions")
    .update({ next_due_date: next, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
  return { error: null };
}
