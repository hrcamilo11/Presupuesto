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
    member_count: (account.shared_account_members as unknown as { count: number }[])?.[0]?.count ?? 0
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
  if (!user) return { data: null, error: "No autenticado" };
  const trimmed = name.trim();
  if (!trimmed) return { data: null, error: "El nombre es obligatorio" };

  // Generate 6-char random code
  const inviteCode = randomBytes(3).toString("hex").toUpperCase();

  // 1. Create the account
  const { data: account, error: accountError } = await supabase
    .from("shared_accounts")
    .insert({
      name: trimmed,
      created_by: user.id,
      invite_code: inviteCode,
    })
    .select()
    .single();

  if (accountError) return { data: null, error: accountError.message };

  revalidatePath("/shared");
  revalidatePath("/dashboard");
  return { data: account, error: null };
}

export async function joinSharedAccount(code: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const trimmedCode = code.trim().toUpperCase();
  if (!trimmedCode) return { error: "El código es obligatorio" };

  // Use the secure RPC function to join
  const { error } = await supabase.rpc("join_shared_account_by_code", {
    p_code: trimmedCode,
  });

  if (error) {
    if (error.message.includes("max 5")) return { error: "Este grupo ya ha alcanzado el límite de 5 miembros" };
    if (error.message.includes("Invalid")) return { error: "Código inválido o cuenta no encontrada" };
    return { error: error.message };
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

  // Use the secure RPC function to accept invite
  const { error } = await supabase.rpc("accept_shared_account_invite", {
    p_token: token,
  });

  if (error) {
    if (error.message.includes("expired")) return { error: "Enlace inválido o expirado" };
    if (error.message.includes("max 5")) return { error: "Este grupo ya ha alcanzado el límite de 5 miembros" };
    return { error: error.message };
  }

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

export async function deleteSharedAccount(sharedAccountId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  // Delete the account. RLS will ensure only the owner can do this.
  const { error } = await supabase
    .from("shared_accounts")
    .delete()
    .eq("id", sharedAccountId)
    .eq("created_by", user.id);

  if (error) return { error: error.message };
  revalidatePath("/shared");
  revalidatePath("/dashboard");
  return { error: null };
}
