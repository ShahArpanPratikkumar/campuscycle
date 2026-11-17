import "server-only";

import { connectToDatabase } from "@/lib/db/connect";

/**
 * MongoDB connection entrypoint.
 *
 * The project keeps its cached Mongoose connection in `lib/db/connect.ts`
 * (with hot-reload safety, index bootstrapping and health helpers). This file
 * provides the requested `lib/mongodb.ts` path and reuses that implementation
 * instead of creating a second connection cache.
 */

export { connectToDatabase as default };
export {
  connectToDatabase,
  disconnectFromDatabase,
  getDatabaseState,
  getMongoUri,
  isDatabaseConnected,
} from "@/lib/db/connect";
