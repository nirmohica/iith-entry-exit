// PostgreSQL database connection

// Anup Chavan
// 26 March 2025

// CRUD functions for residents, visitors and access logs

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
	user: process.env.DB_USER || 'db_user',
	host: process.env.DB_HOST || 'localhost',
	database: process.env.DB_NAME || 'gateAccess',
	password: process.env.DB_PASS || 'db_password',
	port: Number(process.env.DB_PORT) || 5432,
});

