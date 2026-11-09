import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import upload from "../middleware/upload.js";
import {
  getMySalon,
  saveMySalon,
   getPublicSalon,
} from "../controllers/salonController.js";

const router = express.Router();

// Customer-facing public route
router.get("/public", getPublicSalon);

// Salon owner routes
router.get("/my", adminAuth, getMySalon);
router.post("/my", adminAuth, upload.single("image"),saveMySalon);

// Keep your other existing salon routes here.

export default router;