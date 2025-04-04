// PostgreSQL database connection
import pg from "pg";
const { Pool } = pg;
import * as dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  user: process.env.DB_USER || "db_user",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "gateAccess",
  password: process.env.DB_PASS || "db_password",
  port: Number(process.env.DB_PORT) || 5432,
});
