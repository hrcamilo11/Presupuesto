"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import type { SharedAccount } from "@/lib/database.types";

export async function getMySharedAccounts() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: [], error: "No autenticado" };

  const { data, error } = await supabase
    .from("shared_accounts")
    .select(`
      id, 
      name, 
      created_by, 
      created_at, 
      invite_code,
      shared_account_members(count)
    `)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };

  const formattedData = data?.map(account => ({
    ...account,
    member_count: (account.shared_account_members as any)?.[0]?.count ?? 0
  })) as SharedAccount[];

  return { data: formattedData ?? [], error: null };
}

export async function getSharedAccountMembers(sharedAccountId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: [], error: "No autenticado" };

  const { data, error } = await supabase
    .from("shared_account_members")
    .select("id, user_id, role, joined_at")
    .eq("shared_account_id", sharedAccountId)
    .order("joined_at", { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export async function createSharedAccount(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const trimmed = name.trim();
  if (!trimmed) return { error: "El nombre es obligatorio" };

  // Generate 6-char random code
  const inviteCode = randomBytes(3).toString("hex").toUpperCase();

  const { error } = await supabase.from("shared_accounts").insert({
    name: trimmed,
    created_by: user.id,
    invite_code: inviteCode,
  });

  if (error) return { error: error.message };
  revalidatePath("/shared");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function joinSharedAccount(code: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const trimmedCode = code.trim().toUpperCase();
  if (!trimmedCode) return { error: "El código es obligatorio" };

  // Find account by code
  const { data: account, error: findError } = await supabase
    .from("shared_accounts")
    .select("id, name")
    .eq("invite_code", trimmedCode)
    .single();

  if (findError || !account) return { error: "Código inválido o cuenta no encontrada" };

  // Check member limit (Max 5)
  const { count, error: countError } = await supabase
    .from("shared_account_members")
    .select("*", { count: "exact", head: true })
    .eq("shared_account_id", account.id);

  if (countError) return { error: "Error al verificar el límite de miembros" };
  if (count !== null && count >= 5) return { error: "Este grupo ya ha alcanzado el límite de 5 miembros" };

  // Add member
  const { error: insertError } = await supabase.from("shared_account_members").insert({
    shared_account_id: account.id,
    user_id: user.id,
    role: "member",
  });

  if (insertError) {
    if (insertError.code === "23505") return { error: "Ya eres miembro de esta cuenta" };
    return { error: insertError.message };
  }

  revalidatePath("/shared");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function createInvite(sharedAccountId: string, origin?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado", link: null };

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error } = await supabase.from("shared_account_invites").insert({
    shared_account_id: sharedAccountId,
    token,
    invited_by: user.id,
    expires_at: expiresAt.toISOString(),
  });

  if (error) return { error: error.message, link: null };
  revalidatePath("/shared");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin || "";
  const link = baseUrl ? `${baseUrl.replace(/\/$/, "")}/invite?token=${token}` : `/invite?token=${token}`;
  return { error: null, link };
}

export async function acceptInvite(token: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión para aceptar la invitación" };

  const { data: invite, error: fetchError } = await supabase
    .from("shared_account_invites")
    .select("id, shared_account_id, expires_at")
    .eq("token", token)
    .single();

  if (fetchError || !invite) return { error: "Enlace inválido o expirado" };
  if (new Date(invite.expires_at) < new Date()) return { error: "Este enlace ha expirado" };

  // Check member limit (Max 5)
  const { count, error: countError } = await supabase
    .from("shared_account_members")
    .select("*", { count: "exact", head: true })
    .eq("shared_account_id", invite.shared_account_id);

  if (countError) return { error: "Error al verificar el límite de miembros" };
  if (count !== null && count >= 5) return { error: "Este grupo ya ha alcanzado el límite de 5 miembros" };

  const { error: insertError } = await supabase.from("shared_account_members").insert({
    shared_account_id: invite.shared_account_id,
    user_id: user.id,
    role: "member",
  });

  if (insertError) {
    if (insertError.code === "23505") return { error: "Ya eres miembro de esta cuenta" };
    return { error: insertError.message };
  }

  await supabase.from("shared_account_invites").delete().eq("id", invite.id);
  revalidatePath("/shared");
  revalidatePath("/dashboard");
  revalidatePath("/invite");
  return { error: null };
}

export async function leaveSharedAccount(sharedAccountId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("shared_account_members")
    .delete()
    .eq("shared_account_id", sharedAccountId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/shared");
  revalidatePath("/dashboard");
  return { error: null };
}
