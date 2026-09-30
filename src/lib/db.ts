import mongoose from "mongoose";
import { seedIfEmpty } from "./seed";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lingua";

type Cache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  seeded: boolean;
};

const globalWithCache = global as typeof globalThis & { _linguaMongo?: Cache };

const cache: Cache = globalWithCache._linguaMongo || {
  conn: null,
  promise: null,
  seeded: false,
};

globalWithCache._linguaMongo = cache;

export async function connectDb() {
  if (cache.conn) {
    if (!cache.seeded) {
      await seedIfEmpty();
      cache.seeded = true;
    }
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = (async () => {
      let lastError: unknown;
      for (let attempt = 1; attempt <= 20; attempt += 1) {
        try {
          return await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
          });
        } catch (error) {
          lastError = error;
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
      throw lastError;
    })();
  }

  cache.conn = await cache.promise;
  if (!cache.seeded) {
    await seedIfEmpty();
    cache.seeded = true;
  }
  return cache.conn;
}
