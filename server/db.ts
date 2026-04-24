import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: isProduction ? 20 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on("error", (err) => {
  console.error("[Database] Pool error (will reconnect):", err.message);
});

if (isProduction) {
  setInterval(async () => {
    try {
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
    } catch (err: any) {
      console.warn("[Database] Keepalive ping failed:", err.message);
    }
  }, 60000);
}

export const db = drizzle(pool, { schema });
