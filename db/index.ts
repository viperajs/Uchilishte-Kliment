import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export function getDb() {
  const url = process.env.TURSO_DATABASE_URL || "file:.data/local.db";
  return drizzle(createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN }), { schema });
}
