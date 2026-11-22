import { type NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import { readJsonBody } from "@/lib/api/request";
import { jsonCreated } from "@/lib/api/response";
import { registerUser } from "@/lib/services/auth.service";
import { registerSchema } from "@/lib/validators/auth";

/**
 * POST /api/auth/register
 * Creates a MongoDB user with a bcrypt-hashed password. No session cookie is
 * set here — the browser is sent to /login after a successful registration.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await readJsonBody(request);
  const input = registerSchema.parse(body);
  const { user } = await registerUser(input);

  // `user` is built by toAuthUser(): it can never contain a password hash.
  return jsonCreated({ user }, undefined, "Registration successful");
});
