import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import { clearSessionCookie } from "@/lib/auth/session";

/**
 * POST /api/auth/logout
 * Expires the HTTP-only cookie. There is no server-side token blacklist: the
 * JWT is short-lived and the browser loses it as soon as the cookie is cleared.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async () => {
  await clearSessionCookie();
  return NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });
});
