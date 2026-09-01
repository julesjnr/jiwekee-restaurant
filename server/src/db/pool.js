import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

let poolConfig = {};

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
} else if (process.env.DB_HOST || process.env.PGHOST) {
  poolConfig.host = process.env.DB_HOST || process.env.PGHOST;
  poolConfig.port = Number(process.env.DB_PORT || process.env.PGPORT) || 5432;
  poolConfig.user = process.env.DB_USER || process.env.PGUSER || "postgres";
  poolConfig.password = process.env.DB_PASSWORD || process.env.PGPASSWORD || "";
  poolConfig.database = process.env.DB_NAME || process.env.PGDATABASE || "jiwekee_restaurant";
} else {
  // Default local Unix socket / localhost configuration
  poolConfig.connectionString = "postgresql://julesjnr@/jiwekee_restaurant?host=/var/run/postgresql";
}

if (process.env.NODE_ENV === "production" && process.env.DATABASE_SSL === "true") {
  poolConfig.ssl = { rejectUnauthorized: false };
}

export const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("[PostgreSQL] Unexpected error on idle client:", err.message);
});

export default pool;
