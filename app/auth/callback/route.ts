import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { FAILOVER_USER_ID_COOKIE } from "@/lib/backend/auth-context";

/**
 * Ruta de callback para Supabase Auth.
 * Tras confirmar email o OAuth, Supabase redirige aquí con ?code=...
 * Intercambiamos el code por una sesión, guardamos user_id para failover Appwrite, y redirigimos al dashboard.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user?.id) {
      const res = NextResponse.redirect(new URL(next, requestUrl.origin));
      res.cookies.set(FAILOVER_USER_ID_COOKIE, data.user.id, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });
      return res;
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=auth_callback_failed", requestUrl.origin)
  );
}
