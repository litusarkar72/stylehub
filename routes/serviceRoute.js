
import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import upload from "../middleware/upload.js";

import {
  createService,
  updateService,
  getSalonServices,
  updateServiceStatus,
  getPublicServices,
  deleteService,
} from "../controllers/serviceController.js";

const router = express.Router();

// Public services
router.get("/public", getPublicServices);

// Admin service management
router.get("/my", adminAuth, getSalonServices);
router.post("/add", adminAuth, upload.single("image"), createService);
router.put("/:id", adminAuth, upload.single("image"), updateService);
router.patch("/:id/status", adminAuth, updateServiceStatus);
router.delete("/:id", adminAuth, deleteService);

export default router;
