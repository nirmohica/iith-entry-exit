import { pool } from "./index.js";

/**
 * Get the latest access records for a resident
 */
export const latestAccesses = async (residentid: string) => {
  const result = await pool.query("SELECT * FROM latest_accesses($1)", [
    residentid,
  ]);
  return result.rows;
};

/**
 * Add an entry record for a resident (e.g., when they enter the premises)
 */
export const addResidentEntry = async (residentid: string) => {
  await pool.query("CALL add_resident_entry($1)", [residentid]);
};

/**
 * Add an exit record for a resident (e.g., when they leave the premises)
 */
export const addResidentExit = async (residentId: string) => {
  await pool.query("CALL add_resident_exit($1)", [residentId]);
};

/**
 * Add an exit record for a visitor
 */
export const addVisitorExit = async (residentId: string, visitorId: number) => {
  await pool.query("CALL add_visitor_exit($1, $2)", [residentId, visitorId]);
};

/**
 * Search for residents by a given input string (name, apartment, etc.)
 */
export const searchResident = async (input: string) => {
  const result = await pool.query("SELECT * FROM search_resident($1)", [input]);
  return result.rows;
};

/**
 * Get the top (most frequent) visitors for a resident
 */
export const topVisitors = async (residentId: string) => {
  const result = await pool.query("SELECT * FROM top_visitors($1)", [
    residentId,
  ]);
  return result.rows;
};

/**
 * Add a new visitor entry
 * Returns an object with access_id and OTP for verification
 */
export const addVisitorEntry = async (
  residentId: string,
  visitorNames: string[],
  vehicleNumber: string | null,
  vehicleType: string | null,
  expectedStay: string, // e.g., '2 days'
) => {
  const result = await pool.query(
    "SELECT * FROM add_visitor_entry($1, $2, $3, $4, $5)",
    [residentId, visitorNames, vehicleNumber, vehicleType, expectedStay],
  );
  return result.rows[0];
};

/**
 * Retrieve the email address of a resident
 */
export const getResidentEmail = async (residentId: string) => {
  const result = await pool.query(
    "SELECT email FROM resident WHERE resident_id = $1",
    [residentId],
  );
  return result.rows.length > 0 ? result.rows[0].email : null;
};

/**
 * Validate an OTP for a visitor entry
 */
export const validateOTP = async (
  access_id: string,
  otp: string,
): Promise<boolean> => {
  const result = await pool.query(
    "SELECT validate_visitor_entry($1, $2) AS valid",
    [access_id, otp],
  );
  if (result.rows.length === 0) {
    return false;
  }
  return result.rows[0].valid;
};

/**
 * Cancel a visitor's access using accessId
 */
export const deleteVisitorEntry = async (accessId: number) => {
  const result = await pool.query("CALL cancel_visitor_access($1)", [accessId]);
  return result.rows;
};
