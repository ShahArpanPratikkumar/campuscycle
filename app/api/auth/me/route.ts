import { withErrorHandler } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/errors";
import { sessionErrorMessage, verifySessionToken } from "@/lib/auth/jwt";
import { getSessionToken } from "@/lib/auth/session";
import { toAuthUser } from "@/lib/auth/serialize";
import { jsonOk } from "@/lib/api/response";
import { User } from "@/lib/db/models/user.model";

/**
 * GET /api/auth/me
 * Resolves the current user from the HTTP-only cookie. Used by the client auth
 * provider on mount and after login/logout to keep React state in sync.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const token = await getSessionToken();

  if (!token) {
    throw ApiError.unauthorized("Missing authentication cookie. Please log in.");
  }

  let payload: ReturnType<typeof verifySessionToken>;
  try {
    payload = verifySessionToken(token);
  } catch (error) {
    throw ApiError.unauthorized(sessionErrorMessage(error));
  }

  const user = await User.findById(payload.userId).lean();
  if (!user) {
    throw ApiError.unauthorized("This account no longer exists. Please log in again.");
  }

  return jsonOk({ user: toAuthUser(user) });
});
