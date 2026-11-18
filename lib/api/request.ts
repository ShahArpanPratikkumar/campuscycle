import "server-only";

import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/api/errors";

/**
 * Reads and parses a JSON request body.
 *
 * `request.json()` throws an opaque `SyntaxError` on malformed input, which
 * would surface as a 500. Parsing the text ourselves lets us return a proper
 * `400 VALIDATION_ERROR` instead. An empty body is treated as `{}` so that
 * PUT/POST handlers can still report the missing fields clearly.
 */
export async function readJsonBody(request: NextRequest): Promise<unknown> {
  let text: string;

  try {
    text = await request.text();
  } catch {
    throw ApiError.validation(
      [{ field: "(body)", message: "The request body could not be read." }],
      "Could not read the request body.",
    );
  }

  if (text.trim().length === 0) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw ApiError.validation(
      [{ field: "(body)", message: "Request body must be valid JSON." }],
      "Malformed JSON body.",
    );
  }
}
