
import crypto from "crypto";
import Razorpay from "razorpay";
import mongoose from "mongoose";

import Payment from "../models/paymentModel.js";
import Queue from "../models/queueModel.js";
import QueueCounter from "../models/queueCounterModel.js";
import Service from "../models/serviceModel.js";
import Salon from "../models/salonModel.js";
import { getTodayDate } from "../utils/date.js";

// Create Razorpay instance only when needed.
// This avoids reading environment variables before dotenv is loaded.
const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay API keys are missing in backend .env");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

// Compare signatures safely.
const safeCompare = (first, second) => {
  if (
    typeof first !== "string" ||
    typeof second !== "string" ||
    !/^[a-f0-9]{64}$/i.test(first) ||
    !/^[a-f0-9]{64}$/i.test(second)
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(first, "hex"),
    Buffer.from(second, "hex")
  );
};

// Notify salon dashboard.
const notifySalon = (req, salonId, queue) => {
  const io = req.app.get("io");

  if (io) {
    io.to(`salon-${salonId}`).emit("queue-updated", {
      queueId: queue._id,
      status: queue.status,
    });
  }
};

// Create queue after payment has been verified.
// Repeated calls for the same payment return the existing queue.
const finalizeCapturedPayment = async (req, orderId, paymentId) => {
  const paymentRecord = await Payment.findOne({ orderId });

  if (!paymentRecord) {
    throw new Error("Payment order not found");
  }

  if (paymentRecord.status === "paid" && paymentRecord.queueId) {
    const existingQueue = await Queue.findById(paymentRecord.queueId);

    if (existingQueue) {
      return existingQueue;
    }
  }

  // Recover if queue creation succeeded but payment update did not.
  const existingPaymentQueue = await Queue.findOne({
    razorpayPaymentId: paymentId,
  });

  if (existingPaymentQueue) {
    await Payment.updateOne(
      { _id: paymentRecord._id },
      {
        $set: {
          status: "paid",
          razorpayPaymentId: paymentId,
          queueId: existingPaymentQueue._id,
          paidAt: new Date(),
        },
      }
    );

    return existingPaymentQueue;
  }

  // Claim this payment for processing.
  // An abandoned processing attempt can be retried after two minutes.
  const claimedPayment = await Payment.findOneAndUpdate(
    {
      _id: paymentRecord._id,
      $or: [
        { status: "created" },
        {
          status: "processing",
          processingAt: {
            $lt: new Date(Date.now() - 2 * 60 * 1000),
          },
        },
      ],
    },
    {
      $set: {
        status: "processing",
        processingAt: new Date(),
        razorpayPaymentId: paymentId,
      },
    },
    {
      new: true,
    }
  );

  if (!claimedPayment) {
    const latestPayment = await Payment.findById(paymentRecord._id);

    if (latestPayment?.status === "paid" && latestPayment.queueId) {
      const queue = await Queue.findById(latestPayment.queueId);

      if (queue) return queue;
    }

    throw new Error("Payment is already being processed. Please retry shortly.");
  }

  try {
    const queueDate = getTodayDate();

    // Do not create another active queue for the same service.
    const existingActiveQueue = await Queue.findOne({
      salonId: claimedPayment.salonId,
      userId: claimedPayment.userId,
      serviceId: claimedPayment.serviceId,
      queueDate,
      status: {
        $in: ["waiting", "called", "in-service"],
      },
    });

    if (existingActiveQueue) {
      throw new Error(
        "You already have an active queue for this service. Contact support about this payment."
      );
    }

    const counter = await QueueCounter.findOneAndUpdate(
      {
        salonId: claimedPayment.salonId,
        queueDate,
      },
      {
        $inc: { lastNumber: 1 },
      },
      {
        new: true,
        upsert: true,
      }
    );

    const queue = await Queue.create({
      salonId: claimedPayment.salonId,
      userId: claimedPayment.userId,
      serviceId: claimedPayment.serviceId,
      queueNumber: counter.lastNumber,
      queueDate,

      amount: claimedPayment.amount / 100,
      currency: claimedPayment.currency,
      paymentStatus: "paid",
      paymentMethod: "razorpay",
      razorpayOrderId: claimedPayment.orderId,
      razorpayPaymentId: paymentId,
    });

    await Payment.updateOne(
      { _id: claimedPayment._id },
      {
        $set: {
          status: "paid",
          razorpayPaymentId: paymentId,
          queueId: queue._id,
          paidAt: new Date(),
        },
      }
    );

    notifySalon(req, claimedPayment.salonId, queue);

    return queue;
  } catch (error) {
    // Keep the payment retryable if queue creation failed.
    await Payment.updateOne(
      {
        _id: claimedPayment._id,
        status: "processing",
        queueId: null,
      },
      {
        $set: {
          status: "created",
          processingAt: null,
        },
      }
    );

    throw error;
  }
};

// ========================================
// 1. CREATE RAZORPAY ORDER
// ========================================


export const createPaymentOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { serviceId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in first",
      });
    }

    if (!mongoose.isValidObjectId(serviceId)) {
      return res.status(400).json({
        success: false,
        message: "Valid service ID is required",
      });
    }

    const service = await Service.findOne({
      _id: serviceId,
      isActive: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or unavailable",
      });
    }

    const salon = await Salon.findById(service.salonId);

    if (!salon || !salon.isActive) {
      return res.status(400).json({
        success: false,
        message: "Salon is currently unavailable",
      });
    }

    const existingQueue = await Queue.findOne({
      salonId: service.salonId,
      userId,
      serviceId,
      queueDate: getTodayDate(),
      status: {
        $in: ["waiting", "called", "in-service"],
      },
    });

    if (existingQueue) {
      return res.status(409).json({
        success: false,
        message: "You already have an active queue for this service",
        queue: existingQueue,
      });
    }

    const pendingPayment = await Payment.findOne({
      userId,
      serviceId,
      status: {
        $in: ["created", "processing"],
      },
      createdAt: {
        $gte: new Date(Date.now() - 15 * 60 * 1000),
      },
    });

    if (pendingPayment) {
  const razorpay = getRazorpay();

  const existingOrder = await razorpay.orders.fetch(
    pendingPayment.orderId
  );

  return res.status(200).json({
    success: true,
    message: "Resuming existing payment",
    keyId: process.env.RAZORPAY_KEY_ID,
    orderId: existingOrder.id,
    amount: existingOrder.amount,
    currency: existingOrder.currency,
    serviceName: service.name,
    salonName: salon.name,
  });
}

    // Convert rupees into paise for Razorpay.
    const amountInRupees = Number(service.price);
    const amount = Math.round(amountInRupees * 100);

    if (
      !Number.isFinite(amountInRupees) ||
      !Number.isSafeInteger(amount) ||
      amount < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid service price",
      });
    }

    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `sh_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      notes: {
        userId: userId.toString(),
        salonId: service.salonId.toString(),
        serviceId: service._id.toString(),
      },
    });

    // Save both paise and rupees in MongoDB.
    await Payment.create({
      orderId: order.id,
      userId,
      salonId: service.salonId,
      serviceId: service._id,
      amount: order.amount,
      amountInRupees: order.amount / 100,
      currency: "INR",
      status: "created",
    });

    return res.status(201).json({
      success: true,
      message: "Payment order created",
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      serviceName: service.name,
      salonName: salon.name,
    });

  } catch (error) {
    console.error("Create payment order error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to create payment order",
    });
  }
};


// ========================================
// 2. VERIFY RAZORPAY PAYMENT
// ========================================

export const verifyPayment = async (req, res) => {
  try {
    const userId = req.userId;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are missing",
      });
    }

    // Find the order created by our backend.
    const paymentRecord = await Payment.findOne({
      orderId: razorpay_order_id,
      userId,
    });

    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: "Payment order not found",
      });
    }

    // Generate signature using the stored order ID.
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(
        `${paymentRecord.orderId}|${razorpay_payment_id}`
      )
      .digest("hex");

    if (!safeCompare(expectedSignature, razorpay_signature)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    const razorpay = getRazorpay();

    // Verify actual payment status with Razorpay.
    const [order, payment] = await Promise.all([
      razorpay.orders.fetch(paymentRecord.orderId),
      razorpay.payments.fetch(razorpay_payment_id),
    ]);

    if (
      payment.order_id !== paymentRecord.orderId ||
      Number(payment.amount) !== paymentRecord.amount ||
      Number(order.amount) !== paymentRecord.amount ||
      payment.currency !== paymentRecord.currency ||
      order.currency !== paymentRecord.currency
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount or order details do not match",
      });
    }

    if (payment.status !== "captured" || payment.captured !== true) {
      return res.status(409).json({
        success: false,
        message:
          "Payment has not been captured yet. Please check the payment status.",
        paymentStatus: payment.status,
      });
    }

    const queue = await finalizeCapturedPayment(
      req,
      paymentRecord.orderId,
      razorpay_payment_id
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified and queue confirmed",
      queue,
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Payment verification failed",
    });
  }
};

// ========================================
// 3. RAZORPAY WEBHOOK
// ========================================

export const paymentWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (!webhookSecret) {
      return res.status(500).send("Webhook secret is not configured");
    }

    if (!Buffer.isBuffer(req.body) || !signature) {
      return res.status(400).send("Invalid webhook request");
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)
      .digest("hex");

    if (!safeCompare(expectedSignature, signature)) {
      return res.status(400).send("Invalid webhook signature");
    }

    const event = JSON.parse(req.body.toString("utf8"));

    // We only finalize captured payments.
    if (event.event === "payment.captured") {
      const capturedPayment = event.payload?.payment?.entity;

      if (
        capturedPayment?.order_id &&
        capturedPayment?.id &&
        capturedPayment.status === "captured"
      ) {
        const paymentRecord = await Payment.findOne({
          orderId: capturedPayment.order_id,
        });

        if (
          paymentRecord &&
          Number(capturedPayment.amount) === paymentRecord.amount &&
          capturedPayment.currency === paymentRecord.currency
        ) {
          await finalizeCapturedPayment(
            req,
            capturedPayment.order_id,
            capturedPayment.id
          );
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Webhook received",
    });
  } catch (error) {
    console.error("Razorpay webhook error:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};



export const refundQueuePayment = async (req, res) => {
  try {
    const { queueId } = req.params;

    if (!mongoose.isValidObjectId(queueId)) {
      return res.status(400).json({
        success: false,
        message: "Valid queue ID is required",
      });
    }

    // Find the payment associated with this queue.
    const payment = await Payment.findOne({
      queueId,
      status: "paid",
    });

    if (!payment || !payment.razorpayPaymentId) {
      return res.status(404).json({
        success: false,
        message: "Paid payment not found for this queue",
      });
    }

    // Prevent duplicate refunds.
    if (
      payment.refundStatus === "pending" ||
      payment.refundStatus === "processed"
    ) {
      return res.status(409).json({
        success: false,
        message: "Refund has already been requested",
        refundId: payment.refundId,
        refundStatus: payment.refundStatus,
      });
    }

    const Queue = mongoose.model("Queue");
    const queue = await Queue.findById(queueId);

    if (!queue || queue.status !== "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Only cancelled queues can be refunded",
      });
    }

    const razorpay = getRazorpay();

    // Confirm Razorpay payment is captured.
    const razorpayPayment = await razorpay.payments.fetch(
      payment.razorpayPaymentId
    );

    if (razorpayPayment.status !== "captured") {
      return res.status(400).json({
        success: false,
        message: "Only captured payments can be refunded",
      });
    }

    // Full refund. Amount is in paise.
    const refund = await razorpay.payments.refund(
      payment.razorpayPaymentId,
      {
        amount: payment.amount,
        speed: "normal",
        notes: {
          queueId: queueId.toString(),
          reason: "Customer queue cancelled",
        },
      }
    );

    payment.refundId = refund.id;
    payment.refundStatus =
      refund.status === "processed" ? "processed" : "pending";
    payment.refundedAmount = refund.amount;

    if (refund.status === "processed") {
      payment.refundedAt = new Date();
    }

    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Refund request submitted successfully",
      refundId: refund.id,
      refundStatus: payment.refundStatus,
      refundedAmount: refund.amount / 100,
    });
  } catch (error) {
    console.error("Refund payment error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to process refund",
    });
  }
};
