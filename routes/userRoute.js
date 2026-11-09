import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  getProfile,
  getProfileUploadSignature,
  saveProfileImage,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);

router.post(
  "/profile/upload-signature",
  authMiddleware,
  getProfileUploadSignature
);

router.post(
  "/profile/save-image",
  authMiddleware,
  saveProfileImage
);

export default router;