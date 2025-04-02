import express from "express";
import cors from "cors";
import residentRoutes from "./routes/resident.js";
import visitorRoutes from "./routes/visitor.js";

const app = express();

app.use(express.json());
app.use(cors());

// API route handlers
app.use("/api/resident", residentRoutes);
app.use("/api/visitor", visitorRoutes);

// Start the server
const PORT = process.env.DB_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
