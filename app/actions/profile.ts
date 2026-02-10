"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Profile } from "@/lib/database.types";

const profileBasicsSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(80, "El nombre es demasiado largo.")
    .nullable()
    .optional(),
  currency: z
    .string()
    .trim()
    .min(3, "Moneda inválida.")
    .max(10, "Moneda inválida.")
    .optional(),
  timezone: z
    .string()
    .trim()
    .min(3, "Zona horaria inválida.")
    .max(64, "Zona horaria inválida.")
    .optional(),
});

const dashboardSettingsSchema = z.object({
  default_dashboard_context: z.string().trim().min(1).optional(),
  default_wallet_id: z.string().uuid().nullable().optional(),
  dashboard_settings: z
    .object({
      show_summary_cards: z.boolean().optional(),
      show_budget_summary: z.boolean().optional(),
      show_accounts_preview: z.boolean().optional(),
      show_savings_goals: z.boolean().optional(),
      show_trend_chart: z.boolean().optional(),
      show_pie_charts: z.boolean().optional(),
      show_quick_access: z.boolean().optional(),
      show_distribution_section: z.boolean().optional(),
      sections_order: z.array(z.string()).optional(),
    })
    .optional(),
});

const wipePersonalDataSchema = z.object({
  password: z.string().min(6, "La contraseña es requerida."),
});

export async function getMyProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "No autenticado" };

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as Profile, error: null };
}

export async function updateMyProfileBasics(input: z.infer<typeof profileBasicsSchema>) {
  const parsed = profileBasicsSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" ");
    return { error: msg || "Datos inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("profiles")
    .update({
      ...(parsed.data.full_name !== undefined ? { full_name: parsed.data.full_name } : {}),
      ...(parsed.data.currency !== undefined ? { currency: parsed.data.currency } : {}),
      ...(parsed.data.timezone !== undefined ? { timezone: parsed.data.timezone } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateMyDashboardSettings(input: z.infer<typeof dashboardSettingsSchema>) {
  const parsed = dashboardSettingsSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" ");
    return { error: msg || "Datos inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // Merge existing dashboard_settings to avoid overwriting unknown keys
  const { data: current } = await supabase
    .from("profiles")
    .select("dashboard_settings")
    .eq("id", user.id)
    .single();

  const mergedDashboardSettings = {
    ...(current?.dashboard_settings ?? {}),
    ...(parsed.data.dashboard_settings ?? {}),
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      ...(parsed.data.default_dashboard_context !== undefined
        ? { default_dashboard_context: parsed.data.default_dashboard_context }
        : {}),
      ...(parsed.data.default_wallet_id !== undefined
        ? { default_wallet_id: parsed.data.default_wallet_id }
        : {}),
      ...(parsed.data.dashboard_settings !== undefined
        ? { dashboard_settings: mergedDashboardSettings }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function wipeMyPersonalData(input: z.infer<typeof wipePersonalDataSchema>) {
  const parsed = wipePersonalDataSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" ");
    return { error: msg || "Datos inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { error: "No autenticado" };

  // Verificar contraseña solicitando un login explícito con el mismo usuario
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.password,
  });

  if (authError) {
    return { error: "Contraseña incorrecta. No se realizaron cambios." };
  }

  const userId = user.id;

  try {
    // 1. Préstamos personales (no compartidos)
    const { data: personalLoans } = await supabase
      .from("loans")
      .select("id")
      .eq("user_id", userId)
      .is("shared_account_id", null);
    const loanIds = (personalLoans ?? []).map((l) => l.id);
    if (loanIds.length) {
      await supabase.from("loan_payments").delete().in("loan_id", loanIds);
      await supabase.from("loans").delete().in("id", loanIds);
    }

    // 2. Metas de ahorro personales
    const { data: personalGoals } = await supabase
      .from("savings_goals")
      .select("id")
      .eq("user_id", userId)
      .is("shared_account_id", null);
    const goalIds = (personalGoals ?? []).map((g) => g.id);
    if (goalIds.length) {
      await supabase.from("savings_transactions").delete().in("savings_goal_id", goalIds);
      await supabase.from("savings_plans").delete().in("savings_goal_id", goalIds);
      await supabase.from("savings_goals").delete().in("id", goalIds);
    }

    // 3. Ingresos y gastos personales (sin cuentas compartidas)
    await supabase
      .from("incomes")
      .delete()
      .eq("user_id", userId)
      .is("shared_account_id", null);

    await supabase
      .from("expenses")
      .delete()
      .eq("user_id", userId)
      .is("shared_account_id", null);

    // 4. Suscripciones, impuestos personales
    await supabase
      .from("subscriptions")
      .delete()
      .eq("user_id", userId)
      .is("shared_account_id", null);

    await supabase
      .from("tax_obligations")
      .delete()
      .eq("user_id", userId)
      .is("shared_account_id", null);

    // 5. Presupuestos y transferencias de billeteras
    await supabase.from("budgets").delete().eq("user_id", userId);
    await supabase.from("wallet_transfers").delete().eq("user_id", userId);

    // 6. Poner en cero el balance de las billeteras personales (no tocar compartidas)
    await supabase.from("wallets").update({ balance: 0 }).eq("user_id", userId);
  } catch (e: unknown) {
    console.error("Error al limpiar datos personales:", e);
    return {
      error:
        e instanceof Error
          ? e.message
          : "Ocurrió un error al limpiar tu cuenta personal. Intenta nuevamente.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/incomes");
  revalidatePath("/expenses");
  revalidatePath("/loans");
  revalidatePath("/savings");
  revalidatePath("/wallets");
  return { error: null };
}

