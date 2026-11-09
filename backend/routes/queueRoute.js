
import express from "express";

import {
  getMyQueue,
  getMyQueueHistory,
  getSalonQueueHistory,
  getSalonQueue,
  callNextCustomer,
  startService,
  completeService,
  getDashboardStats,
  getPublicSalonQueue,
  getMyActiveQueue,
  getMyQueuePosition,
  cancelQueue,
} from "../controllers/queueController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// ========================================
// CUSTOMER ROUTES
// ========================================

// Get customer's active queue
router.get("/my-active", authMiddleware, getMyActiveQueue);

// Get customer's queue history
router.get("/my-history", authMiddleware, getMyQueueHistory);

// Get specific customer queue
router.get("/my/:queueId", authMiddleware, getMyQueue);

// Get customer's queue position
router.get(
  "/my-position/:queueId",
  authMiddleware,
  getMyQueuePosition
);

// Customer cancels their own queue
router.patch(
  "/cancel/:queueId",
  authMiddleware,
  cancelQueue
);

// ========================================
// PUBLIC ROUTES
// ========================================

router.get("/public/:salonId", getPublicSalonQueue);

// ========================================
// ADMIN DASHBOARD ROUTES
// ========================================

router.get(
  "/dashboard/:salonId",
  authMiddleware,
  adminAuth,
  getDashboardStats
);

// ========================================
// ADMIN QUEUE ROUTES
// ========================================

// Get salon queue
router.get(
  "/salon/:salonId",
  authMiddleware,
  adminAuth,
  getSalonQueue
);

// Get salon queue history
router.get(
  "/salon-history/:salonId",
  authMiddleware,
  adminAuth,
  getSalonQueueHistory
);

// ========================================
// ADMIN QUEUE MANAGEMENT
// ========================================

// Call next customer
router.post(
  "/call-next",
  authMiddleware,
  adminAuth,
  callNextCustomer
);

// Start customer service
router.post(
  "/start",
  authMiddleware,
  adminAuth,
  startService
);

// Complete customer service
router.post(
  "/complete",
  authMiddleware,
  adminAuth,
  completeService
);

export default router;
