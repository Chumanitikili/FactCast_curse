import { Pool } from "pg";
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
export async function connectDB() {
  await pool.connect();
  console.log("Postgres connected.");
}