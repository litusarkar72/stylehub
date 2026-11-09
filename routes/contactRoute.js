
import express from "express";

import {
  sendContactMessage,
  getContactMessages,
  updateContactStatus,
} from "../controllers/contactController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// Public: customers can send messages without logging in
router.post("/send", sendContactMessage);

// Protected: only authenticated admins can view messages
router.get("/admin/messages", authMiddleware, adminAuth, getContactMessages);

// Protected: admin updates message status
router.patch(
  "/admin/messages/:messageId",
  authMiddleware,
  adminAuth,
  updateContactStatus
);

export default router;
