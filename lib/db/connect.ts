import "server-only";

import mongoose, { type ConnectOptions, type Mongoose } from "mongoose";

// Side-effect import: registering every model here means `ensureIndexes()` can
// always see the full set, even when the first request to arrive is one that
// does not itself touch a model (e.g. `GET /api/health`).
import "@/lib/db/models";

/**
 * MongoDB connection utility.
 *
 * Why this file exists and why it looks like this:
 *
 * 1. **One connection, reused.** Next.js route handlers run as serverless-style
 *    functions. Opening a new connection per request would exhaust Atlas's
 *    connection limit, so the connection is cached on `globalThis` and shared
 *    across hot reloads and invocations.
 *
 * 2. **Survives HMR.** In development every edit re-evaluates modules. A plain
 *    module-level variable would leak a connection per reload; stashing the
 *    cache on `globalThis` avoids that.
 *
 * 3. **Fails fast.** `bufferCommands: false` means a query against a down
 *    database rejects immediately instead of hanging until the function times
 *    out.
 *
 * 4. **Server-only.** The `server-only` import makes it a build error to import
 *    this module from a client component, so `MONGODB_URI` can never leak into
 *    a browser bundle.
 *
 * `disconnectFromDatabase()` exists for scripts/tests; route handlers should
 * only ever call `connectToDatabase()`.
 */

const CONNECTION_OPTIONS: ConnectOptions = {
  // Reject queries instead of buffering them while disconnected.
  bufferCommands: false,
  // How long to wait for a suitable server before erroring.
  serverSelectionTimeoutMS: 10_000,
  // Keep the pool small — serverless functions are short-lived.
  maxPoolSize: 10,
  // Never build indexes implicitly: `next start` runs with NODE_ENV=production,
  // where Mongoose's autoIndex would silently do nothing and unique constraints
  // (BR-10/11/12) would not exist. Indexes are created explicitly instead —
  // see `ensureIndexes()`.
  autoIndex: false,
};

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  var __campuscycleMongoose: MongooseCache | undefined;
}

const cache: MongooseCache =
  globalThis.__campuscycleMongoose ?? { conn: null, promise: null };

globalThis.__campuscycleMongoose = cache;

/**
 * Reads and validates `MONGODB_URI`.
 *
 * Resolved lazily (inside the connect call) rather than at module scope so that
 * importing a model during `next build` never throws when the variable is unset.
 */
export function getMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy `.env.example` to `.env.local` and add a MongoDB connection string.",
    );
  }
  return uri;
}

/** Returns a cached, connected Mongoose instance, connecting on first use. */
export async function connectToDatabase(): Promise<Mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    const uri = getMongoUri();
    const dbName = process.env.MONGODB_DB_NAME?.trim() || undefined;

    // Ignore unknown keys in queries instead of silently matching everything.
    mongoose.set("strictQuery", true);

    cache.promise = mongoose.connect(
      uri,
      dbName ? { ...CONNECTION_OPTIONS, dbName } : CONNECTION_OPTIONS,
    );
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    // Reset so the next request retries instead of reusing a rejected promise.
    cache.promise = null;
    throw error;
  }

  await ensureIndexes();

  return cache.conn;
}

/**
 * Builds any missing indexes declared on the registered models.
 *
 * `autoIndex` is disabled (see `CONNECTION_OPTIONS`), so this is the single
 * place indexes are created. It runs once per process, the first time a
 * connection is established, rather than on every request.
 *
 * `Model.createIndexes()` is idempotent and additive: it creates indexes that
 * do not exist yet and never drops a collection or rewrites documents. Every
 * model is registered up-front by the `@/lib/db/models` import at the top of
 * this file, so the full index set is created on the first connection.
 */
async function ensureIndexes(): Promise<void> {
  const models = Object.values(mongoose.models);

  const results = await Promise.allSettled(
    models.map((model) => model.createIndexes()),
  );

  results.forEach((result) => {
    if (result.status === "rejected") {
      // A failed index build (e.g. pre-existing duplicate data) must not take
      // the whole API down; log it loudly so it can be fixed.
      console.error("[db] Could not build an index:", result.reason);
    }
  });
}

/** Closes the shared connection. Intended for scripts and tests only. */
export async function disconnectFromDatabase(): Promise<void> {
  if (!cache.conn) return;
  await cache.conn.disconnect();
  cache.conn = null;
  cache.promise = null;
}

/** `true` when Mongoose reports an open connection. */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

const READY_STATES: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
  99: "uninitialized",
};

/** Human-readable connection state for the health endpoint. */
export function getDatabaseState(): string {
  return READY_STATES[mongoose.connection.readyState] ?? "unknown";
}
