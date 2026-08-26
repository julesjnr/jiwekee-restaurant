import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://julesjnr@/jiwekee_restaurant?host=/var/run/postgresql";

export const pool = new Pool({
  connectionString,
  ssl:
    process.env.NODE_ENV === "production" && process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: false }
      : false,
});

pool.on("error", (err) => {
  console.error("[PostgreSQL] Unexpected error on idle client:", err.message);
});

export default pool;
