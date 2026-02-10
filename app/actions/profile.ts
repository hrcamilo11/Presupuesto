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
    })
    .optional(),
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

