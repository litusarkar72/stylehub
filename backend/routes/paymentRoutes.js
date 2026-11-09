
import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import adminAuth from "../middleware/adminAuth.js";

import {
  createPaymentOrder,
  verifyPayment,
  refundQueuePayment,
} from "../controllers/paymentController.js";

const router = express.Router();

// Customer payment routes
router.post(
  "/create-order",
  authMiddleware,
  createPaymentOrder
);

router.post(
  "/verify",
  authMiddleware,
  verifyPayment
);

// Admin-only refund route
router.post(
  "/refund/:queueId",
  authMiddleware,
  adminAuth,
  refundQueuePayment
);

export default router;
