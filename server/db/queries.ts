// anup chavan
// 26 mar 2025

// crud functions for residents, visitors and accesses

import { pool } from './index.js';

// latest accesses
export const latestAccesses = async (residentid: string) => {
	console.log(pool);
	const result = await pool.query(
		'select * from latest_accesses($1)',
		[residentid]
	);
	console.log(result.rows);
	return result.rows;
};

// add resident entries
export const addResidentEntry = async (residentid: string) => {
	await pool.query('call add_resident_entry($1)', [residentid]);
};


// add resident exit
export const addResidentExit = async (residentId: string) => {
	await pool.query('CALL add_resident_exit($1)', [residentId]);
};

// add visitor exit
export const addVisitorExit = async (residentId: string, visitorId: number) => {
	await pool.query('CALL add_visitor_exit($1, $2)', [residentId, visitorId]);
};

// search resident
export const searchResident = async (input: string) => {
	const result = await pool.query('SELECT * FROM search_resident($1)', [input]);
	return result.rows;
};

// top visitors function
export const topVisitors = async (residentId: string) => {
	const result = await pool.query('SELECT * FROM top_visitors($1)', [residentId]);
	return result.rows;
};

// 27 mar 2025: addVisitorEntry
export const addVisitorEntry = async (
	residentId: string,
	visitorNames: string[],
	vehicleNumber: string | null,
	vehicleType: string | null,
	expectedStay: string // as an interval literal, e.g., '2 days'
) => {
	const result = await pool.query(
		'SELECT * FROM add_visitor_entry($1, $2, $3, $4, $5)',
		[residentId, visitorNames, vehicleNumber, vehicleType, expectedStay]
	);
	return result.rows[0]; // returns { access_id, otp }
};

export const getResidentEmail = async (residentId: string) => {
	const result = await pool.query(
		'SELECT email FROM resident WHERE resident_id = $1',
		[residentId]
	);
	return result.rows.length > 0 ? result.rows[0].email : null;
};
