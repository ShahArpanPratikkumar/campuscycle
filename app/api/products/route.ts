import { type NextRequest } from "next/server";
import { requireActor } from "@/lib/api/actor";
import { withErrorHandler } from "@/lib/api/handler";
import { parseQuery } from "@/lib/api/query";
import { readJsonBody } from "@/lib/api/request";
import { jsonCreated, jsonOk } from "@/lib/api/response";
import { createProduct, listProducts } from "@/lib/services/product.service";
import {
  createProductSchema,
  productQuerySchema,
} from "@/lib/validators/product";

/**
 * `/api/products` — the marketplace catalogue.
 *
 *   GET  /api/products?q=&category=&condition=&type=&status=&minPrice=
 *                     &maxPrice=&sort=&sellerId=&page=&limit=
 *   POST /api/products   (requires the authenticated HTTP-only session cookie)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const query = parseQuery(productQuerySchema, request);
  const { items, meta } = await listProducts(query);
  return jsonOk(items, meta);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const actor = await requireActor(request);
  const body = await readJsonBody(request);
  const input = createProductSchema.parse(body);
  const product = await createProduct(actor, input);
  return jsonCreated(product);
});
