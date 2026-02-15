import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { FAILOVER_USER_ID_COOKIE } from "@/lib/backend/auth-context";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    response.cookies.set(FAILOVER_USER_ID_COOKIE, user.id, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password";
  const isAuthCallback = pathname === "/auth/callback";
  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname === "/incomes" ||
    pathname === "/expenses" ||
    pathname === "/subscriptions" ||
    pathname === "/loans" ||
    pathname === "/taxes" ||
    pathname === "/wallets" ||
    pathname === "/categories" ||
    pathname === "/savings" ||
    pathname === "/tags" ||
    pathname === "/budgets" ||
    pathname === "/notifications" ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname === "/shared" ||
    pathname.startsWith("/shared/") ||
    pathname === "/update-password" ||
    pathname === "/";

  const failoverUserId = request.cookies.get(FAILOVER_USER_ID_COOKIE)?.value;
  const hasAuth = Boolean(user?.id) || Boolean(failoverUserId);

  if (isAuthCallback) {
    return response;
  }
  if (pathname === "/" && hasAuth) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (isAuthRoute && hasAuth) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (isDashboardRoute && !hasAuth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}
