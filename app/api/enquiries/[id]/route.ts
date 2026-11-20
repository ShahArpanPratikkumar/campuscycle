import { type NextRequest } from "next/server";
import { requireActor } from "@/lib/api/actor";
import { withErrorHandler } from "@/lib/api/handler";
import { readJsonBody } from "@/lib/api/request";
import { jsonOk } from "@/lib/api/response";
import {
  getEnquiryById,
  respondToEnquiry,
} from "@/lib/services/enquiry.service";
import { respondEnquirySchema } from "@/lib/validators/enquiry";

/**
 * `/api/enquiries/[id]` — a single enquiry.
 *
 *   GET   /api/enquiries/[id]   → seller or buyer only
 *   PUT   /api/enquiries/[id]   → { action: "accept" | "reject" | "cancel",
 *                                 response? }
 *   PATCH /api/enquiries/[id]   → alias of PUT
 *
 * Accepting an enquiry does **not** reserve the product (BR-15).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EnquiryRouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandler<EnquiryRouteContext>(
  async (request: NextRequest, context) => {
    const { id } = await context.params;
    const actor = await requireActor(request);
    const enquiry = await getEnquiryById(id, actor);
    return jsonOk(enquiry);
  },
);

export const PUT = withErrorHandler<EnquiryRouteContext>(
  async (request: NextRequest, context) => {
    const { id } = await context.params;
    const actor = await requireActor(request);
    const body = await readJsonBody(request);
    const input = respondEnquirySchema.parse(body);
    const enquiry = await respondToEnquiry(actor, id, input);
    return jsonOk(enquiry);
  },
);

export const PATCH = PUT;
