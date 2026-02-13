"use server";

import { getAppwriteUsers } from "@/lib/appwrite/client";
import { setFailoverUserId } from "@/lib/backend/auth-context";

/**
 * Crea el usuario en Appwrite con el mismo ID que Supabase (user.id).
 * Así, al hacer login por Appwrite, account.get().$id coincide con el user_id de la app.
 * La API Key de Appwrite debe tener permiso "Users" (create).
 */
export async function createAppwriteUser(
  supabaseUserId: string,
  email: string,
  password: string,
  name?: string | null
): Promise<{ error?: string }> {
  const users = getAppwriteUsers();
  if (!users) {
    return {}; // Appwrite no configurado: no fallar el registro
  }
  try {
    await users.create({
      userId: supabaseUserId,
      email,
      password,
      name: name ?? undefined,
    });
    return {};
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error creando usuario en Appwrite";
    return { error: message };
  }
}

/**
 * Establece la cookie de failover con el user ID (de Appwrite; en nuestro flujo es el mismo que Supabase).
 * Se llama tras un login exitoso con Appwrite para permitir acceso al dashboard.
 */
export async function setFailoverCookieFromAppwriteUserId(
  appwriteUserId: string
): Promise<{ error?: string }> {
  try {
    await setFailoverUserId(appwriteUserId);
    return {};
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error estableciendo sesión de respaldo";
    return { error: message };
  }
}
