import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth/constants";
import { isSessionTokenValid } from "@/lib/auth/jwt";

/**
 * Route protection.
 *
 * Next.js 16 renamed `middleware.ts` to `proxy.ts` (the old name is
 * deprecated). This proxy only runs on protected pages — the marketplace,
 * seller profiles and the home page stay public. It verifies the JWT in the
 * HTTP-only cookie *before* any protected page data is rendered.
 *
 * Pages/layouts repeat the check on the server as defence in depth; the API
 * routes resolve the actor from the same cookie in `lib/api/actor.ts`.
 */

const PROTECTED_PREFIXES = ["/dashboard", "/sell", "/favorites"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (isSessionTokenValid(token)) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  // Only a same-site path is echoed back, so this cannot become an open redirect.
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/sell",
    "/sell/:path*",
    "/favorites",
    "/favorites/:path*",
  ],
};
