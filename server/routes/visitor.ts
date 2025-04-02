import express from "express";
import {
  addVisitorEntry,
  addVisitorExit,
  getResidentEmail,
  deleteVisitorEntry,
  validateOTP,
} from "../db/queries.js";
import { sendOTP } from "../utils/email.js";

const router = express.Router();

/**
 * POST /api/visitor/entry
 * Adds a new visitor entry. If visitor is unaccompanied, generates and emails an OTP to the resident.
 */
router.post("/entry", async (req, res) => {
  try {
    const {
      residentId,
      visitorNames,
      vehicleNumber,
      vehicleType,
      expectedStay,
    } = req.body;

    // Validate required fields
    if (
      !residentId ||
      !visitorNames ||
      !Array.isArray(visitorNames) ||
      !expectedStay
    ) {
      return res.status(400).json({ error: "Invalid input data" });
    }

    const result = await addVisitorEntry(
      residentId,
      visitorNames,
      vehicleNumber || null,
      vehicleType || null,
      expectedStay,
    );

    // If OTP is generated, send it via email
    if (result.otp !== "0") {
      const residentEmail = await getResidentEmail(residentId);
      if (residentEmail) {
        await sendOTP(residentEmail, result.otp);
      } else {
        console.error("Resident email not found for OTP sending");
      }
    }

    const message =
      result.otp === "0"
        ? "Resident accompanied visitor entry recorded"
        : "Visitor entry recorded and OTP sent";

    res.json({ message, accessId: result.access_id });
  } catch (error) {
    console.error("Visitor entry error:", error);
    res.status(500).json({ error: "Error adding visitor entry" });
  }
});

/**
 * POST /api/visitor/exit
 * Marks a visitor's exit from the premises
 */
router.post("/exit", async (req, res) => {
  try {
    const { residentId, visitorId } = req.body;
    await addVisitorExit(residentId, visitorId);
    res.json({ message: "Visitor exit recorded" });
  } catch (error) {
    console.error("Visitor exit error:", error);
    res.status(500).json({ error: "Error marking visitor exit" });
  }
});

/**
 * DELETE /api/visitor/entry/:accessId
 * Cancels a visitor access entry by ID
 */
router.delete("/entry/:accessId", async (req, res) => {
  try {
    const accessId = parseInt(req.params.accessId, 10);
    if (isNaN(accessId)) {
      return res.status(400).json({ error: "Invalid access ID" });
    }

    await deleteVisitorEntry(accessId);
    res.json({ message: `Visitor access with ID ${accessId} canceled.` });
  } catch (error) {
    console.error("Cancel visitor entry error:", error);
    res.status(500).json({ error: "Error canceling visitor entry" });
  }
});

/**
 * POST /api/visitor/otp-verify
 * Verifies OTP for a visitor's access
 */
router.post("/otp-verify", async (req, res) => {
  try {
    const { accessId, otp } = req.body;

    if (!accessId || !otp) {
      return res.status(400).json({ error: "Invalid input data" });
    }

    const isValid = await validateOTP(accessId, otp);

    if (isValid) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid OTP" });
    }
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ error: "Error verifying OTP" });
  }
});

export default router;
