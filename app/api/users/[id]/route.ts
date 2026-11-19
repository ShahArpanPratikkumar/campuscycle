import { type NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/response";
import { getUserById } from "@/lib/services/user.service";

/**
 * `/api/users/[id]` — a single student profile.
 *
 *   GET /api/users/[id]   → public profile (no auth)
 *
 * The client-side identity chip reads the signed-in user from `/api/auth/me`;
 * this endpoint is only for public profile lookup by id.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UserRouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandler<UserRouteContext>(
  async (_request: NextRequest, context) => {
    const { id } = await context.params;
    const user = await getUserById(id);
    return jsonOk(user);
  },
);
