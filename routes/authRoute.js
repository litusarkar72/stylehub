import express from "express";

import {
  register,
  login,
  registerAdmin,
  adminLogin,
} from "../controllers/authController.js";

const router = express.Router();

// Customer routes
router.post("/register", register);
router.post("/login", login);

// Admin routes
router.post("/admin/register", registerAdmin);
router.post("/admin/login", adminLogin);

export default router;