import { cookies } from "next/headers";

/** Cookie donde guardamos user_id para poder leer en failover (Appwrite) cuando Supabase está caído */
export const FAILOVER_USER_ID_COOKIE = "sb_failover_uid";

export async function getUserIdForFailover(): Promise<string | null> {
  const store = await cookies();
  const c = store.get(FAILOVER_USER_ID_COOKIE);
  return c?.value ?? null;
}

export async function setFailoverUserId(userId: string): Promise<void> {
  const store = await cookies();
  store.set(FAILOVER_USER_ID_COOKIE, userId, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
}
