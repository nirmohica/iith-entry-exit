// anup chavan
// 26 mar 2025

// resident-related endpoints

import express from 'express';
import { latestAccesses, addResidentEntry, addResidentExit, searchResident, topVisitors } from '../db/queries.js';

const router = express.Router();

// GET /resident/:id/latest-accesses
router.get('/:id/latest-accesses', async (req, res) => {
	try {
		const data = await latestAccesses(req.params.id);
		res.json(data);
	} catch (error) {
		res.status(500).json({ error: 'Error fetching latest accesses' });
	}
});

// POST /resident/entry
router.post('/entry', async (req, res) => {
	try {
		const { residentId } = req.body;
		await addResidentEntry(residentId);
		res.json({ message: 'Resident entry added' });
	} catch (error) {
		res.status(500).json({ error: 'Error adding resident entry' });
	}
});

// POST /resident/exit
router.post('/exit', async (req, res) => {
	try {
		const { residentId } = req.body;
		await addResidentExit(residentId);
		res.json({ message: 'Resident exit marked' });
	} catch (error) {
		res.status(500).json({ error: 'Error marking resident exit' });
	}
});

// GET /resident/:id/top-visitors
router.get('/:id/top-visitors', async (req, res) => {
	try {
		const data = await topVisitors(req.params.id);
		res.json(data);
	} catch (error) {
		res.status(500).json({ error: 'Error fetching top visitors' });
	}
});

// GET /resident/search/:query
router.get('/search/:query', async (req, res) => {
	try {
		const data = await searchResident(req.params.query);
		res.json(data);
	} catch (error) {
		console.error('Search resident error:', error);
		res.status(500).json({ error: 'Error searching residents' });
	}
});
export default router;
