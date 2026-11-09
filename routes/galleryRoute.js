import express from "express";
import {
  getSalonGallery,
  addGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
} from "../controllers/galleryController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Public: customers can view an active salon's gallery
router.get("/salon/:salonId", getSalonGallery);

// Protected: salon owners can manage their own images
router.post(
  "/salon/:salonId",
  authMiddleware,
  upload.single("image"),
  addGalleryImage
);

router.put(
  "/:imageId",
  authMiddleware,
  updateGalleryImage
);

router.delete(
  "/:imageId",
  authMiddleware,
  deleteGalleryImage
);

export default router;