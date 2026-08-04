import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_USER_ID_HEADER, AUTH_USER_EMAIL_HEADER } from "@/lib/supabase/get-auth-user";

export async function updateSession(request: NextRequest) {
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.delete(AUTH_USER_ID_HEADER);
  forwardedHeaders.delete(AUTH_USER_EMAIL_HEADER);

  let response = NextResponse.next({ request: { headers: forwardedHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: forwardedHeaders } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: forwardedHeaders } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup") ||
    request.nextUrl.pathname.startsWith("/forgot-password") ||
    request.nextUrl.pathname.startsWith("/reset-password");

  const isProtectedRoute = [
    "/dashboard", "/planner", "/calendar", "/skills",
    "/projects", "/notes", "/resources",
    "/analytics", "/gamification", "/settings",
  ].some((p) => request.nextUrl.pathname.startsWith(p));

  if (!user && isProtectedRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (user) {
    forwardedHeaders.set(AUTH_USER_ID_HEADER, user.id);
    if (user.email) forwardedHeaders.set(AUTH_USER_EMAIL_HEADER, user.email);
    response.headers.set(AUTH_USER_ID_HEADER, user.id);
    if (user.email) response.headers.set(AUTH_USER_EMAIL_HEADER, user.email);
  }

  return response;
}