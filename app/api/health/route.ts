import { NextResponse } from "next/server";
import {
  connectToDatabase,
  getDatabaseState,
  isDatabaseConnected,
} from "@/lib/db/connect";

/**
 * `GET /api/health` — liveness + database connectivity probe.
 *
 * This route is intentionally **not** wrapped in `withErrorHandler`: a failed
 * connection is a meaningful health signal (503), not an unexpected error, and
 * the response must not leak the connection string or stack trace.
 *
 * It is also the cheapest way to warm a cold serverless function.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error("[api] Health check could not reach MongoDB:", error);

    return NextResponse.json(
      {
        success: false,
        error: "The database is unreachable.",
        code: "INTERNAL_ERROR",
        data: {
          status: "down",
          database: getDatabaseState(),
          timestamp: new Date().toISOString(),
        },
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      status: "ok",
      database: getDatabaseState(),
      connected: isDatabaseConnected(),
      timestamp: new Date().toISOString(),
    },
  });
}
