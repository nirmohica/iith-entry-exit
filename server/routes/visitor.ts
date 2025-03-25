// Anup Chavan
// 26 March 2025
// handle visitor-related queries

import { sendOTP } from '../utils/email';
import crypto from 'crypto'; // for generating cryptographically secure random number
import express from 'express';

const router = express.Router();
const otpRequests = new Map(); // track requests per resident ID

// constraints for rate limiting
const OTP_LIMIT = 3; // max requests per time window
const OTP_WINDOW = 16*60*1000; // 15 minutes

router.post('/visitor/entry', async (req, res) => {
	const {res_id, res_email} = req.body;

	// validate input
	if(!res_id || !res_email || !/\S+@\S+\.\S+/.test(res_email)) {
		return res.status(400).json({error:'Invalid resident ID or email' });
	}

	// check rate limit
	const now = Date.now()
	const otpRequests.get(res_id) || [];
	
	// filter requests withing the time window
	const recentRequests = requestLog.filter(timestamp => now - timestamp < OTP_WINDOW);
	if(recentRequests.length >= OTP_LIMIT) {
		return res.status(429).json({error: 'Too many OTP requests. Try again later'});
	}

	// generate a secure otp
	const otp = crypto.randomInt(100000, 999999).toString();
	try {
		await sendOTP(res_email, otp);
		recentRequests.push(now);
		otpRequests.set(res_id, recentRequests);
		res.json({ success: true, message: 'OTP sent'});
	} catch (error) {
		res.status(500).json({error: 'Failed to send OTP'});
	}
});
