import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  hasSupabaseAuthEnv,
  isAdminEmail,
} from "@/lib/supabase/env";

export async function proxy(request: NextRequest) {
  if (!hasSupabaseAuthEnv()) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminArea = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";

  if (!isAdminArea) {
    return response;
  }

  if (isLoginPage && user?.email && isAdminEmail(user.email)) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (!isLoginPage && (!user?.email || !isAdminEmail(user.email))) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
