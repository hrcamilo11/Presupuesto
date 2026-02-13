/**
 * Ejecuta la función principal; si falla (red, timeout, 5xx), ejecuta la de respaldo.
 * Útil para failover Supabase → Appwrite.
 */
export async function withFailover<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  try {
    return await primary();
  } catch (err) {
    if (isNetworkOrServerError(err)) {
      return await fallback();
    }
    throw err;
  }
}

export function isNetworkOrServerError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("fetch") && (msg.includes("timeout") || msg.includes("failed"))) return true;
    if (msg.includes("network") || msg.includes("econnrefused")) return true;
  }
  const status = (err as { status?: number })?.status;
  if (typeof status === "number" && status >= 500) return true;
  return false;
}
