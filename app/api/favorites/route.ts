import { z } from "zod";
import { type NextRequest } from "next/server";
import { requireActor } from "@/lib/api/actor";
import { withErrorHandler } from "@/lib/api/handler";
import { parseQuery } from "@/lib/api/query";
import { readJsonBody } from "@/lib/api/request";
import { jsonCreated, jsonOk } from "@/lib/api/response";
import {
  addFavorite,
  listFavorites,
  removeFavorite,
} from "@/lib/services/favorite.service";
import { objectIdSchema } from "@/lib/validators/common";

/**
 * `/api/favorites` — saved products for the acting student.
 *
 *   GET    /api/favorites                     → list (with availability)
 *   POST   /api/favorites  { productId }      → save (201)
 *   DELETE /api/favorites?productId=...       → unsave (also accepts a JSON body)
 *
 * Every method resolves the student from the authenticated HTTP-only session
 * cookie; favourites are always scoped to that user, never to an id taken from
 * the request body.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const favoriteQuerySchema = z.object({ productId: objectIdSchema.optional() });
const favoriteBodySchema = z.object({ productId: objectIdSchema });

export const GET = withErrorHandler(async (request: NextRequest) => {
  const actor = await requireActor(request);
  const favorites = await listFavorites(actor);
  return jsonOk(favorites);
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const actor = await requireActor(request);
  const body = await readJsonBody(request);
  const { productId } = favoriteBodySchema.parse(body);
  const favorite = await addFavorite(actor, productId);
  return jsonCreated(favorite);
});

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const actor = await requireActor(request);

  const query = parseQuery(favoriteQuerySchema, request);
  const productId =
    query.productId ??
    favoriteBodySchema.parse(await readJsonBody(request)).productId;

  const result = await removeFavorite(actor, productId);
  return jsonOk(result);
});
