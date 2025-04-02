import express from "express";
import {
  latestAccesses,
  addResidentEntry,
  addResidentExit,
  searchResident,
  topVisitors,
} from "../db/queries.js";

const router = express.Router();

/**
 * GET /resident/:id/latest-accesses
 * Returns latest access records for a resident
 */
router.get("/:id/latest-accesses", async (req, res) => {
  try {
    const data = await latestAccesses(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error fetching latest accesses" });
  }
});

/**
 * POST /resident/entry
 * Records a resident's entry into the premises
 */
router.post("/entry", async (req, res) => {
  try {
    const { residentId } = req.body;
    await addResidentEntry(residentId);
    res.json({ message: "Resident entry added" });
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Error adding resident entry" });
  }
});

/**
 * POST /resident/exit
 * Records a resident's exit from the premises
 */
router.post("/exit", async (req, res) => {
  try {
    const { residentId } = req.body;
    await addResidentExit(residentId);
    res.json({ message: "Resident exit marked" });
  } catch (error) {
    res.status(500).json({ error: "Error marking resident exit" });
  }
});

/**
 * GET /resident/:id/top-visitors
 * Returns the most frequent visitors for a resident
 */
router.get("/:id/top-visitors", async (req, res) => {
  try {
    const data = await topVisitors(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error fetching top visitors" });
  }
});

/**
 * GET /resident/search/:query
 * Searches residents by a given string
 * Converts photo buffer to base64 image URL if present
 */
router.get("/search/:query", async (req, res) => {
  try {
    const residents = await searchResident(req.params.query);

    const modifiedResidents = residents.map((resident) => {
      if (resident.photo) {
        resident.photo = `data:image/jpeg;base64,${resident.photo.toString("base64")}`;
      }
      return resident;
    });

    res.json(modifiedResidents);
  } catch (error) {
    console.error("Search resident error:", error);
    res.status(500).json({ error: "Error searching residents" });
  }
});

export default router;
