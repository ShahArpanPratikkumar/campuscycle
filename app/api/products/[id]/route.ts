import { type NextRequest } from "next/server";
import { requireActor } from "@/lib/api/actor";
import { withErrorHandler } from "@/lib/api/handler";
import { readJsonBody } from "@/lib/api/request";
import { jsonOk } from "@/lib/api/response";
import {
  deleteProduct,
  getProductById,
  updateProduct,
} from "@/lib/services/product.service";
import { updateProductSchema } from "@/lib/validators/product";

/**
 * `/api/products/[id]` — a single product.
 *
 *   GET    /api/products/[id]           → public detail
 *   PUT    /api/products/[id]           → update (owner only; also accepts
 *                                         `status` for BR-13 transitions)
 *   PATCH  /api/products/[id]           → alias of PUT
 *   DELETE /api/products/[id]           → soft delete (owner only)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProductRouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandler<ProductRouteContext>(
  async (_request: NextRequest, context) => {
    const { id } = await context.params;
    const product = await getProductById(id);
    return jsonOk(product);
  },
);

export const PUT = withErrorHandler<ProductRouteContext>(
  async (request: NextRequest, context) => {
    const { id } = await context.params;
    const actor = await requireActor(request);
    const body = await readJsonBody(request);
    const patch = updateProductSchema.parse(body);
    const product = await updateProduct(actor, id, patch);
    return jsonOk(product);
  },
);

export const PATCH = PUT;

export const DELETE = withErrorHandler<ProductRouteContext>(
  async (request: NextRequest, context) => {
    const { id } = await context.params;
    const actor = await requireActor(request);
    const product = await deleteProduct(actor, id);
    return jsonOk(product);
  },
);
