
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salon",
      required: true,
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    // Amount in paise for Razorpay.
    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    // Amount in rupees for display.
    amountInRupees: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["created", "processing", "paid", "failed"],
      default: "created",
    },

    // Queue linked to this payment.
    queueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Queue",
      default: null,
    },

    // Refund information.
    refundId: {
      type: String,
      default: null,
    },

    refundStatus: {
      type: String,
      enum: ["not_requested", "pending", "processed", "failed"],
      default: "not_requested",
    },

    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    processingAt: {
      type: Date,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index(
  { razorpayPaymentId: 1 },
  {
    unique: true,
    sparse: true,
  }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
