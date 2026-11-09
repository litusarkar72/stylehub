
import mongoose from "mongoose";

const queueSchema = new mongoose.Schema(
  {
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    queueNumber: {
      type: Number,
      required: true,
    },

    queueDate: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "waiting",
        "called",
        "in-service",
        "completed",
        "cancelled",
      ],
      default: "waiting",
    },

    // Payment information
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded",
        "not-required",
      ],
      default: "paid",
    },

    paymentMethod: {
      type: String,
      default: "razorpay",
    },

    razorpayOrderId: {
      type: String,
      default: null,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    startedAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Unique queue number for each salon on each day
queueSchema.index(
  {
    salonId: 1,
    queueDate: 1,
    queueNumber: 1,
  },
  {
    unique: true,
  }
);

const Queue = mongoose.model("Queue", queueSchema);

export default Queue;
