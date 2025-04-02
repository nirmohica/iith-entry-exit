const BASE_URL = "http://localhost:3000";

/**
 * Record a resident's entry
 */
export const addResidentEntry = async (residentId: string): Promise<any> => {
  const response = await fetch(`${BASE_URL}/api/resident/entry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ residentId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error || `Failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
};

/**
 * Record a resident's exit
 */
export const addResidentExit = async (residentId: string): Promise<any> => {
  const response = await fetch(`${BASE_URL}/api/resident/exit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ residentId }),
  });
  return response.json();
};

/**
 * Search for residents matching the query
 */
export const searchResident = async (query: string): Promise<any[]> => {
  const response = await fetch(
    `${BASE_URL}/api/resident/search/${encodeURIComponent(query)}`,
  );
  return response.json();
};

/**
 * Add a visitor entry and return the response (possibly includes OTP)
 */
export const addVisitorEntry = async (
  residentId: string,
  visitorNames: string[],
  vehicleNumber: string | null,
  vehicleType: string | null,
  expectedStay: string,
): Promise<any> => {
  const response = await fetch(`${BASE_URL}/api/visitor/entry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      residentId,
      visitorNames,
      vehicleNumber,
      vehicleType,
      expectedStay,
    }),
  });
  return response.json();
};

/**
 * Record a visitor's exit
 */
export const addVisitorExit = async (
  residentId: string,
  visitorId: number,
): Promise<any> => {
  const response = await fetch(`${BASE_URL}/api/visitor/exit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ residentId, visitorId }),
  });
  return response.json();
};

/**
 * Fetch the latest access logs for a resident
 */
export const latestAccesses = async (residentId: string): Promise<any[]> => {
  const response = await fetch(
    `${BASE_URL}/api/resident/${encodeURIComponent(residentId)}/latest-accesses`,
  );
  return response.json();
};

/**
 * Cancel a visitor access record
 */
export async function cancelVisitorAccess(accessId: number) {
  const resp = await fetch(`${BASE_URL}/api/visitor/entry/${accessId}`, {
    method: "DELETE",
  });
  if (!resp.ok) {
    throw new Error("Failed to cancel visitor access");
  }
  return resp.json();
}

/**
 * Verify a visitor OTP for entry validation
 */
export async function verifyVisitorOTP(accessId: number, typedOTP: string) {
  const resp = await fetch(`${BASE_URL}/api/visitor/otp-verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessId, otp: typedOTP }),
  });
  if (!resp.ok) {
    throw new Error("OTP verify failed");
  }
  return resp.json(); // Expected: { success: true } or { error: ... }
}
