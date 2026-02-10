import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
    pathname === "/shared" ||
    pathname.startsWith("/shared/") ||
    pathname === "/update-password" ||
    pathname === "/";

  if (isAuthCallback) {
    return response;
  }
  if (pathname === "/" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (isDashboardRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}
