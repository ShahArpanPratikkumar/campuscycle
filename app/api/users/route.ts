import { type NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import { parseQuery } from "@/lib/api/query";
import { readJsonBody } from "@/lib/api/request";
import { jsonCreated, jsonOk } from "@/lib/api/response";
import { createUser, listUsers } from "@/lib/services/user.service";
import { createUserSchema, userQuerySchema } from "@/lib/validators/user";

/**
 * `/api/users` — student profiles.
 *
 * Legacy profile directory. Reads are public; authenticated writes use the
 * HTTP-only session cookie rather than a client-supplied student id.
 *
 *   GET  /api/users?q=&page=&limit=   → paginated directory
 *   POST /api/users                   → create a profile (201)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const query = parseQuery(userQuerySchema, request);
  const { items, meta } = await listUsers(query);
  return jsonOk(items, meta);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await readJsonBody(request);
  const input = createUserSchema.parse(body);
  const user = await createUser(input);
  return jsonCreated(user);
});
