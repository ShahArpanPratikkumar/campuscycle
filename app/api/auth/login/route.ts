import { type NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import { readJsonBody } from "@/lib/api/request";
import { jsonOk } from "@/lib/api/response";
import { setSessionCookie } from "@/lib/auth/session";
import { loginUser } from "@/lib/services/auth.service";
import { loginSchema } from "@/lib/validators/auth";

/**
 * POST /api/auth/login
 * Verifies the password with bcrypt, signs a minimal JWT and stores it in an
 * HTTP-only cookie. The token is never included in the response body.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await readJsonBody(request);
  const input = loginSchema.parse(body);
  const { user, token } = await loginUser(input);

  await setSessionCookie(token, input.remember);

  return jsonOk({ user }, undefined, "Login successful");
});
