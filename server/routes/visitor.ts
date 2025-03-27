// anup chavan
// 26 March 2025

// Visitor-related endpoints

import express from 'express';
import { addVisitorEntry, addVisitorExit, getResidentEmail } from '../db/queries.js';
import { sendOTP } from '../utils/email.js';

const router = express.Router();

// POST /api/visitor/entry
router.post('/entry', async (req, res) => {
	try {
		const { residentId, visitorNames, vehicleNumber, vehicleType, expectedStay } = req.body;

		// Validate required fields.
		if (!residentId || !visitorNames || !Array.isArray(visitorNames) || !expectedStay) {
			return res.status(400).json({ error: 'Invalid input data' });
		}

		// Call our stored function.
		const result = await addVisitorEntry(
			residentId,
			visitorNames,
			vehicleNumber || null,
			vehicleType || null,
			expectedStay // expectedStay is an interval literal, e.g., '2 days'
		);

		// If OTP is generated (i.e., not accompanied, so otp != '0'), retrieve the resident email and send OTP.
		if (result.otp !== '0') {
			const residentEmail = await getResidentEmail(residentId);
			if (residentEmail) {
				await sendOTP(residentEmail, result.otp);
			} else {
				console.error('Resident email not found for OTP sending');
			}
		}

		const message = result.otp === '0'
			? 'Resident accompanied visitor entry recorded'
			: 'Visitor entry recorded and OTP sent';
		res.json({ message, accessId: result.access_id });
	} catch (error) {
		console.error('Visitor entry error:', error);
		res.status(500).json({ error: 'Error adding visitor entry' });
	}
});

// POST /api/visitor/exit
router.post('/exit', async (req, res) => {
	try {
		const { residentId, visitorId } = req.body;
		await addVisitorExit(residentId, visitorId);
		res.json({ message: 'Visitor exit recorded' });
	} catch (error) {
		console.error('Visitor exit error:', error);
		res.status(500).json({ error: 'Error marking visitor exit' });
	}
});

export default router;
