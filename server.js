import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";

import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import salonRoute from "./routes/salonRoute.js";
import serviceRoute from "./routes/serviceRoute.js";
import queueRoute from "./routes/queueRoute.js";
import galleryRoute from "./routes/galleryRoute.js";
import contactRoute from "./routes/contactRoute.js";

import paymentRoute from "./routes/paymentRoutes.js";
import { paymentWebhook } from "./controllers/paymentController.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// ========================================
// DATABASE CONNECTION
// ========================================

connectDB();

// ========================================
// CORS CONFIGURATION
// ========================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",

  // Admin Netlify
  "https://gorgeous-hotteok-25a012.netlify.app",

  // Main frontend Netlify
  "https://taupe-semifreddo-7d8302.netlify.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("CORS blocked origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// ========================================
// RAZORPAY WEBHOOK
// IMPORTANT: Must be before express.json()
// ========================================

app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  paymentWebhook
);

// ========================================
// MIDDLEWARE
// ========================================

app.use(express.json());
app.use(cookieParser());

// ========================================
// API ROUTES
// ========================================

app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/salons", salonRoute);
app.use("/api/services", serviceRoute);
app.use("/api/queue", queueRoute);
app.use("/api/gallery", galleryRoute);
app.use("/api/contact", contactRoute);
app.use("/api/payment", paymentRoute);

// ========================================
// SOCKET.IO CONFIGURATION
// ========================================

export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

// Make Socket.IO available to controllers
app.set("io", io);

io.on("connection", (socket) => {
  socket.on("join-salon", (salonId) => {
    if (
      typeof salonId !== "string" ||
      !/^[a-f\d]{24}$/i.test(salonId)
    ) {
      return;
    }

    const room = `salon-${salonId}`;

    if (socket.rooms.has(room)) {
      return;
    }

    socket.join(room);
  });

  socket.on("leave-salon", (salonId) => {
    if (
      typeof salonId !== "string" ||
      !/^[a-f\d]{24}$/i.test(salonId)
    ) {
      return;
    }

    socket.leave(`salon-${salonId}`);
  });
});

// ========================================
// GLOBAL ERROR HANDLING
// ========================================

app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 8000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
