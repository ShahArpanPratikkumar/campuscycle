import { type NextRequest } from "next/server";
import { requireActor } from "@/lib/api/actor";
import { withErrorHandler } from "@/lib/api/handler";
import { parseQuery } from "@/lib/api/query";
import { readJsonBody } from "@/lib/api/request";
import { jsonCreated, jsonOk } from "@/lib/api/response";
import {
  createEnquiry,
  listEnquiries,
} from "@/lib/services/enquiry.service";
import {
  createEnquirySchema,
  enquiryQuerySchema,
} from "@/lib/validators/enquiry";

/**
 * `/api/enquiries` — buyer → seller questions.
 *
 *   GET  /api/enquiries?role=seller|buyer|all&status=&productId=&page=&limit=
 *   POST /api/enquiries   (requires the authenticated HTTP-only session cookie)
 *
 * `role` scopes the list to the actor's inbox (received) or outbox (sent).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const actor = await requireActor(request);
  const query = parseQuery(enquiryQuerySchema, request);
  const { items, meta } = await listEnquiries(query, actor);
  return jsonOk(items, meta);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const actor = await requireActor(request);
  const body = await readJsonBody(request);
  const input = createEnquirySchema.parse(body);
  const enquiry = await createEnquiry(actor, input);
  return jsonCreated(enquiry);
});
