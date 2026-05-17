import mongoose from "mongoose";
import dns from "node:dns";

// Force reliable DNS for Atlas SRV lookups on networks that block SRV records.
// This must run at module load time (before any connect attempt) to be effective.
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
  // Prefer IPv4 first (helps on some networks/ISPs).
  dns.setDefaultResultOrder?.("ipv4first");
} catch {
  // best-effort: if the runtime disallows this, fall back to OS DNS
}

if (process.env.NODE_ENV === 'development') {
  console.log("[db] dns servers:", dns.getServers());
}

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConn:
    | {
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

function classifyMongoError(err: unknown): string {
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";

  if (/querySrv|ENOTFOUND|EAI_AGAIN/i.test(message)) {
    return "DNS_LOOKUP_FAILED";
  }
  if (/Authentication failed|bad auth|auth/i.test(message)) {
    return "AUTH_FAILED";
  }
  if (/IP.*whitelist|not authorized|ECONNREFUSED|ETIMEDOUT|timed out/i.test(message)) {
    return "NETWORK_OR_WHITELIST";
  }
  return "UNKNOWN";
}

/**
 * Connect to MongoDB via Mongoose.
 *
 * Notes:
 * - Uses a global cached promise to avoid creating many connections in dev (HMR).
 * - Uses short timeouts so connection problems fail fast (instead of "hanging").
 */
export default async function connectDB(): Promise<typeof mongoose> {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  if (process.env.NODE_ENV === 'development') {
    console.log("[db] uri scheme:", mongoUri.startsWith("mongodb+srv://") ? "mongodb+srv" : "mongodb");
  }

  if (mongoose.connection.readyState === 1) return mongoose;

  const cache = (globalThis.__mongooseConn ??= { promise: null });
  if (!cache.promise) {
    cache.promise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 60000,
    });
  }

  try {
    await cache.promise;
    return mongoose;
  } catch (err) {
    cache.promise = null;
    const kind = classifyMongoError(err);
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "";
    throw new Error(`MONGO_CONNECT_FAILED:${kind}:${message}`);
  }
}
