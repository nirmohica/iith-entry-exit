// Anup Chavan
// 26 March 2025

import express from 'express';
import residentRoutes from './routes/resident.js';
// import visitorRoutes from './routes/visitor';

const app = express();
app.use(express.json());

// register the resident and visitor routes
app.use('/api/resident', residentRoutes);
// app.use('/api/visitor', visitorRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
