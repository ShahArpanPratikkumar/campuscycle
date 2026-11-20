import { type NextRequest } from "next/server";
import { requireActor } from "@/lib/api/actor";
import { withErrorHandler } from "@/lib/api/handler";
import { readJsonBody } from "@/lib/api/request";
import { jsonOk } from "@/lib/api/response";
import { getOfferById, respondToOffer } from "@/lib/services/offer.service";
import { respondOfferSchema } from "@/lib/validators/offer";

/**
 * `/api/offers/[id]` — a single offer.
 *
 *   GET   /api/offers/[id]   → seller or buyer only
 *   PUT   /api/offers/[id]   → { action: "accept" | "reject" | "withdraw"
 *                               | "counter", counterPrice?, note? }
 *   PATCH /api/offers/[id]   → alias of PUT
 *
 * Accepting an offer reserves the product and auto-rejects sibling offers
 * (BR-14).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OfferRouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandler<OfferRouteContext>(
  async (request: NextRequest, context) => {
    const { id } = await context.params;
    const actor = await requireActor(request);
    const offer = await getOfferById(id, actor);
    return jsonOk(offer);
  },
);

export const PUT = withErrorHandler<OfferRouteContext>(
  async (request: NextRequest, context) => {
    const { id } = await context.params;
    const actor = await requireActor(request);
    const body = await readJsonBody(request);
    const input = respondOfferSchema.parse(body);
    const offer = await respondToOffer(actor, id, input);
    return jsonOk(offer);
  },
);

export const PATCH = PUT;
