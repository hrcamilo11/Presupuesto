import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Cliente Supabase con service role. Solo usar en server (actions, API routes).
 * Bypasea RLS; no exponer en cliente.
 */
export function createAdminClient() {
  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos para el cliente admin");
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}
