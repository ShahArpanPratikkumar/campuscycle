import { type NextRequest } from "next/server";
import { requireActor } from "@/lib/api/actor";
import { withErrorHandler } from "@/lib/api/handler";
import { parseQuery } from "@/lib/api/query";
import { readJsonBody } from "@/lib/api/request";
import { jsonCreated, jsonOk } from "@/lib/api/response";
import { createOffer, listOffers } from "@/lib/services/offer.service";
import { createOfferSchema, offerQuerySchema } from "@/lib/validators/offer";

/**
 * `/api/offers` — formal price proposals (sale products only).
 *
 *   GET  /api/offers?role=seller|buyer|all&status=&productId=&page=&limit=
 *   POST /api/offers   (requires the authenticated HTTP-only session cookie)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const actor = await requireActor(request);
  const query = parseQuery(offerQuerySchema, request);
  const { items, meta } = await listOffers(query, actor);
  return jsonOk(items, meta);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const actor = await requireActor(request);
  const body = await readJsonBody(request);
  const input = createOfferSchema.parse(body);
  const offer = await createOffer(actor, input);
  return jsonCreated(offer);
});
