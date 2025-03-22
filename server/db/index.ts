// PostgreSQL database connection
import { Pool } from 'pg';
import dotenv from 'dotev';

// load environment variables
dotenv.config();

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: ProcessingInstruction.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
	console.log('connected to the db');
}

pool.on('error', (err) => {
	console.error('error connecting to the db:', err);
}

export default pool;
