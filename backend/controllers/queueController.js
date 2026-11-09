
import mongoose from "mongoose";
import Payment from "../models/paymentModel.js";
import Queue from "../models/queueModel.js";
import Salon from "../models/salonModel.js";
import Service from "../models/serviceModel.js";
import QueueCounter from "../models/queueCounterModel.js";
import { getTodayDate } from "../utils/date.js";
import { io } from "../server.js";

const attachPaymentsToQueues = async (queues) => {
  if (!queues || queues.length === 0) {
    return [];
  }

  const queueIds = queues.map((queue) => queue._id);

  const payments = await Payment.find({
    queueId: { $in: queueIds },
  })
    .select(
      "queueId orderId razorpayPaymentId amount amountInRupees currency status refundId refundStatus refundedAmount refundedAt paidAt createdAt updatedAt"
    )
    .sort({ updatedAt: -1 })
    .lean();

  const paymentMap = new Map();

  payments.forEach((payment) => {
    const id = payment.queueId.toString();

    // Keep the latest payment if multiple records exist.
    if (!paymentMap.has(id)) {
      paymentMap.set(id, payment);
    }
  });

  return queues.map((queue) => {
    const queueObject = queue.toObject
      ? queue.toObject()
      : queue;

    return {
      ...queueObject,
      payment: paymentMap.get(queue._id.toString()) || null,
    };
  });
};
// ========================================
// 1. JOIN QUEUE
// ========================================

export const joinQueue = async (req, res) => {
  try {
    const { salonId, serviceId } = req.body;
    const userId = req.userId;

    if (
      !salonId ||
      !serviceId ||
      !mongoose.isValidObjectId(salonId) ||
      !mongoose.isValidObjectId(serviceId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid salon ID and service ID are required",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to join the queue",
      });
    }

    const salon = await Salon.findById(salonId);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found",
      });
    }

    if (!salon.isActive) {
      return res.status(400).json({
        success: false,
        message: "Salon is currently closed",
      });
    }

    const service = await Service.findOne({
      _id: serviceId,
      salonId,
      isActive: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or unavailable",
      });
    }

    const queueDate = getTodayDate();

    const existingQueue = await Queue.findOne({
      salonId,
      userId,
      serviceId,
      queueDate,
      status: {
        $in: ["waiting", "called", "in-service"],
      },
    });

    if (existingQueue) {
      return res.status(400).json({
        success: false,
        message: "You are already in this salon's queue today",
        queue: existingQueue,
      });
    }

    const counter = await QueueCounter.findOneAndUpdate(
      {
        salonId,
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
      salonId,
      userId,
      serviceId,
      queueNumber: counter.lastNumber,
      queueDate,
    });

    io.to(`salon-${salonId}`).emit("queue-updated");

    return res.status(201).json({
      success: true,
      message: "Successfully joined queue",
      queue,
    });
  } catch (error) {
    console.error("Join queue error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to join the queue. Please try again.",
    });
  }
};

// ========================================
// GET CUSTOMER QUEUE DETAILS
// ========================================

export const getMyQueue = async (req, res) => {
  try {
    const { queueId } = req.params;

    if (!mongoose.isValidObjectId(queueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid queue ID",
      });
    }

    const queue = await Queue.findById(queueId)
      .populate("salonId", "name address city phone")
      .populate("serviceId", "name price duration");

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: "Queue entry not found",
      });
    }

    // Verify customer ownership.
    if (queue.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this queue",
      });
    }

    // Attach payment and refund information.
    const [queueWithPayment] =
      await attachPaymentsToQueues([queue]);

    const peopleAhead = await Queue.find({
      salonId: queue.salonId._id,
      queueDate: queue.queueDate,
      queueNumber: {
        $lt: queue.queueNumber,
      },
      status: {
        $in: ["waiting", "called", "in-service"],
      },
    }).populate("serviceId", "duration");

    const estimatedWait = peopleAhead.reduce(
      (total, person) =>
        total + (person.serviceId?.duration || 0),
      0
    );

    return res.status(200).json({
      success: true,
      queue: queueWithPayment,
      peopleAhead: peopleAhead.length,
      estimatedWait,
    });
  } catch (error) {
    console.error("Get my queue error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ========================================
// GET CUSTOMER PERSONAL QUEUE HISTORY
// ========================================

export const getMyQueueHistory = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const queues = await Queue.find({ userId })
      .populate("salonId", "name address city phone")
      .populate("serviceId", "name price duration")
      .sort({ createdAt: -1 });

    // Attach Razorpay payment and refund information.
    const queuesWithPayments =
      await attachPaymentsToQueues(queues);

    return res.status(200).json({
      success: true,
      message: "Your queue history fetched successfully",
      count: queuesWithPayments.length,
      queues: queuesWithPayments,
    });
  } catch (error) {
    console.error("Get my queue history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your queue history",
      error: error.message,
    });
  }
};


// ========================================
// 4. GET TODAY'S ACTIVE SALON QUEUE
// ========================================



export const getSalonQueue = async (req, res) => {
  try {
    const { salonId } = req.params;

    if (!salonId || !mongoose.isValidObjectId(salonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid salon ID",
      });
    }

    const salon = await Salon.findById(salonId);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found",
      });
    }

    // Only the salon owner can view this dashboard.
    if (
      !salon.ownerId ||
      salon.ownerId.toString() !== req.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized",
      });
    }

    const queueDate = getTodayDate();

    const queues = await Queue.find({
      salonId,
      queueDate,
      status: {
        $in: [
          "waiting",
          "called",
          "in-service",
          "completed",
          "cancelled",
        ],
      },
    })
      .populate("userId", "name email phone profileImage")
      .populate("serviceId", "name price duration")
      .sort({ queueNumber: 1 });

    // Fetch payments associated with these queue records.
    const queueIds = queues.map((item) => item._id);

    const payments = await Payment.find({
      queueId: { $in: queueIds },
    }).select(
      "queueId orderId razorpayPaymentId amount amountInRupees currency status refundId refundStatus refundedAmount refundedAt paidAt"
    );

    const paymentMap = new Map(
      payments.map((payment) => [
        payment.queueId.toString(),
        payment,
      ])
    );

    const queuesWithPayments = queues.map((item) => {
      const payment = paymentMap.get(item._id.toString());

      return {
        ...item.toObject(),
        payment: payment
          ? {
              _id: payment._id,
              orderId: payment.orderId,
              razorpayPaymentId: payment.razorpayPaymentId,
              amount: payment.amount,
              amountInRupees: payment.amountInRupees,
              currency: payment.currency,
              status: payment.status,
              refundId: payment.refundId,
              refundStatus: payment.refundStatus,
              refundedAmount: payment.refundedAmount,
              refundedAt: payment.refundedAt,
              paidAt: payment.paidAt,
            }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      count: queuesWithPayments.length,
      queue: queuesWithPayments,
    });
  } catch (error) {
    console.error("Get salon queue error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};




// ========================================
// 5. CALL NEXT CUSTOMER
// ========================================

export const callNextCustomer = async (req, res) => {
  try {
    const { salonId } = req.body;

    if (!salonId || !mongoose.isValidObjectId(salonId)) {
      return res.status(400).json({
        success: false,
        message: "Valid salon ID is required",
      });
    }

    const salon = await Salon.findById(salonId);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found",
      });
    }

    if (salon.ownerId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized",
      });
    }

    const queueDate = getTodayDate();

    const alreadyCalled = await Queue.findOne({
      salonId,
      queueDate,
      status: "called",
    });

    if (alreadyCalled) {
      return res.status(400).json({
        success: false,
        message: "A customer has already been called. Start their service first.",
      });
    }

    const inService = await Queue.findOne({
      salonId,
      queueDate,
      status: "in-service",
    });

    if (inService) {
      return res.status(400).json({
        success: false,
        message: "A customer is currently in service. Complete the service first.",
      });
    }

    const nextCustomer = await Queue.findOne({
      salonId,
      queueDate,
      status: "waiting",
    }).sort({ queueNumber: 1 });

    if (!nextCustomer) {
      return res.status(404).json({
        success: false,
        message: "No customers are waiting",
      });
    }

    nextCustomer.status = "called";
    await nextCustomer.save();

    io.to(`salon-${salonId}`).emit("queue-updated");

    return res.status(200).json({
      success: true,
      message: `Customer #${nextCustomer.queueNumber} called`,
      queue: nextCustomer,
    });
  } catch (error) {
    console.error("Call next error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// 6. START SERVICE
// ========================================

export const startService = async (req, res) => {
  try {
    const { queueId } = req.body;

    if (!queueId || !mongoose.isValidObjectId(queueId)) {
      return res.status(400).json({
        success: false,
        message: "Valid queue ID is required",
      });
    }

    const queue = await Queue.findById(queueId).populate("salonId");

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: "Queue not found",
      });
    }

    if (queue.salonId.ownerId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized",
      });
    }

    if (queue.status !== "called") {
      return res.status(400).json({
        success: false,
        message: "Only a called customer can start service",
      });
    }

    const existingService = await Queue.findOne({
      salonId: queue.salonId._id,
      queueDate: queue.queueDate,
      status: "in-service",
      _id: { $ne: queueId },
    });

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: "Another customer is already in service",
      });
    }

    queue.status = "in-service";
    queue.startedAt = new Date();

    await queue.save();

    io.to(`salon-${queue.salonId._id}`).emit("queue-updated");

    return res.status(200).json({
      success: true,
      message: "Service started",
      queue,
    });
  } catch (error) {
    console.error("Start service error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// 7. COMPLETE SERVICE
// ========================================

export const completeService = async (req, res) => {
  try {
    const { queueId } = req.body;

    if (!queueId || !mongoose.isValidObjectId(queueId)) {
      return res.status(400).json({
        success: false,
        message: "Valid queue ID is required",
      });
    }

    const queue = await Queue.findById(queueId).populate("salonId");

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: "Queue not found",
      });
    }

    if (queue.salonId.ownerId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized",
      });
    }

    if (queue.status !== "in-service") {
      return res.status(400).json({
        success: false,
        message: "Customer is not currently in service",
      });
    }

    queue.status = "completed";
    queue.completedAt = new Date();

    await queue.save();

    io.to(`salon-${queue.salonId._id}`).emit("queue-updated");

    return res.status(200).json({
      success: true,
      message: "Service completed",
      queue,
    });
  } catch (error) {
    console.error("Complete service error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// 8. GET ADMIN DASHBOARD STATISTICS
// ========================================

export const getDashboardStats = async (req, res) => {
  try {
    const { salonId } = req.params;

    if (!mongoose.isValidObjectId(salonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid salon ID",
      });
    }

    const salon = await Salon.findById(salonId);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found",
      });
    }

    if (salon.ownerId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized",
      });
    }

    const queueDate = getTodayDate();

    const queues = await Queue.find({
      salonId,
      queueDate,
    });

    const stats = {
      waiting: 0,
      called: 0,
      inService: 0,
      completed: 0,
      cancelled: 0,
      total: queues.length,
    };

    queues.forEach((queue) => {
      if (queue.status === "waiting") stats.waiting++;
      if (queue.status === "called") stats.called++;
      if (queue.status === "in-service") stats.inService++;
      if (queue.status === "completed") stats.completed++;
      if (queue.status === "cancelled") stats.cancelled++;
    });

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========================================
// 9. GET PUBLIC SALON QUEUE
// ========================================


export const getPublicSalonQueue = async (req, res) => {
  try {
    const { salonId } = req.params;

    if (!salonId || !mongoose.isValidObjectId(salonId)) {
      return res.status(400).json({
        success: false,
        message: "Valid salon ID is required",
      });
    }

    const salon = await Salon.findById(salonId).select(
      "name isActive"
    );

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found",
      });
    }

    const queueDate = getTodayDate();

    const baseQuery = {
      salonId,
      queueDate,
    };

    // Get all status counts
    const [
      waiting,
      called,
      inService,
      completed,
      cancelled,
      counter,
    ] = await Promise.all([
      Queue.countDocuments({
        ...baseQuery,
        status: "waiting",
      }),

      Queue.countDocuments({
        ...baseQuery,
        status: "called",
      }),

      Queue.countDocuments({
        ...baseQuery,
        status: "in-service",
      }),

      Queue.countDocuments({
        ...baseQuery,
        status: "completed",
      }),

      Queue.countDocuments({
        ...baseQuery,
        status: "cancelled",
      }),

      QueueCounter.findOne({
        salonId,
        queueDate,
      }),
    ]);

    // Fetch anonymous active queue records.
    // Do not populate userId or return booking IDs.
    const queue = await Queue.find({
      ...baseQuery,
      status: {
        $in: ["waiting", "called", "in-service"],
      },
    })
      .select("queueNumber status")
      .sort({ queueNumber: 1 })
      .lean();

    const totalActive = waiting + called + inService;

    const nextQueueNumber = (counter?.lastNumber || 0) + 1;

    return res.status(200).json({
      success: true,

      salon: {
        name: salon.name,
        isActive: salon.isActive,
      },

      queueDate,

      queueSummary: {
        waiting,
        called,
        inService,
        completed,
        cancelled,
        totalActive,
      },

      nextQueueNumber,

      queue,
    });
  } catch (error) {
    console.error("Public queue error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch public salon queue",
    });
  }
};


// ========================================
// GET CUSTOMER ACTIVE QUEUE
// ========================================

export const getMyActiveQueue = async (req, res) => {
  try {
    const queueDate = getTodayDate();

    const queue = await Queue.findOne({
      userId: req.userId,
      queueDate,
      status: {
        $in: ["waiting", "called", "in-service"],
      },
    })
      .populate("salonId", "name address city phone")
      .populate("serviceId", "name price duration");

    if (!queue) {
      return res.status(200).json({
        success: true,
        queue: null,
      });
    }

    const [queueWithPayment] =
      await attachPaymentsToQueues([queue]);

    const peopleAhead = await Queue.find({
      salonId: queue.salonId._id,
      queueDate,
      queueNumber: {
        $lt: queue.queueNumber,
      },
      status: {
        $in: ["waiting", "called", "in-service"],
      },
    }).populate("serviceId", "duration");

    const estimatedWait = peopleAhead.reduce(
      (total, item) =>
        total + (item.serviceId?.duration || 0),
      0
    );

    return res.status(200).json({
      success: true,
      queue: queueWithPayment,
      peopleAhead: peopleAhead.length,
      estimatedWait,
    });
  } catch (error) {
    console.error("Get active queue error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ========================================
// 11. GET COMPLETE SALON QUEUE HISTORY
// ========================================


export const getSalonQueueHistory = async (req, res) => {
  try {
    const { salonId } = req.params;
    const userId = req.userId;

    if (!salonId || !mongoose.isValidObjectId(salonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid salon ID",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check salon
    const salon = await Salon.findById(salonId);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: "Salon not found",
      });
    }

    // Verify salon owner
    if (
      !salon.ownerId ||
      salon.ownerId.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this history",
      });
    }

    // Get all salon queue history
    const queues = await Queue.find({ salonId })
      .populate(
        "userId",
        "name email phone profileImage"
      )
      .populate(
        "serviceId",
        "name price duration"
      )
      .populate(
        "salonId",
        "name address city"
      )
      .sort({ createdAt: -1 });

    // Get all queue IDs
    const queueIds = queues.map((queue) => queue._id);

    // Fetch associated payments
    const payments = await Payment.find({
      queueId: { $in: queueIds },
    }).select(
      "queueId orderId razorpayPaymentId amount amountInRupees currency status refundId refundStatus refundedAmount refundedAt paidAt"
    );

    // Create payment lookup map
    const paymentMap = new Map(
      payments.map((payment) => [
        payment.queueId.toString(),
        payment,
      ])
    );

    // Attach payment information to each queue
    const queuesWithPayments = queues.map((queue) => {
      const payment = paymentMap.get(
        queue._id.toString()
      );

      return {
        ...queue.toObject(),

        payment: payment
          ? {
              _id: payment._id,
              orderId: payment.orderId,
              razorpayPaymentId: payment.razorpayPaymentId,
              amount: payment.amount,
              amountInRupees: payment.amountInRupees,
              currency: payment.currency,
              status: payment.status,
              refundId: payment.refundId,
              refundStatus: payment.refundStatus,
              refundedAmount: payment.refundedAmount,
              refundedAt: payment.refundedAt,
              paidAt: payment.paidAt,
            }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Salon history fetched successfully",
      count: queuesWithPayments.length,
      queues: queuesWithPayments,
    });

  } catch (error) {
    console.error("Get salon queue history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch salon queue history",
      error: error.message,
    });
  }
};


export const getMyQueuePosition = async (req, res) => {
  try {
    const { queueId } = req.params;
    const userId = req.userId;

    if (!mongoose.isValidObjectId(queueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid queue ID",
      });
    }

    // Only find the logged-in customer's booking
    const queue = await Queue.findOne({
      _id: queueId,
      userId,
    });

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Aggregate statistics for this salon and queue date
    const baseQuery = {
      salonId: queue.salonId,
      queueDate: queue.queueDate,
    };

    const [
      waiting,
      called,
      inService,
      completed,
      cancelled,
      peopleAhead,
    ] = await Promise.all([
      Queue.countDocuments({
        ...baseQuery,
        status: "waiting",
      }),

      Queue.countDocuments({
        ...baseQuery,
        status: "called",
      }),

      Queue.countDocuments({
        ...baseQuery,
        status: "in-service",
      }),

      Queue.countDocuments({
        ...baseQuery,
        status: "completed",
      }),

      Queue.countDocuments({
        ...baseQuery,
        status: "cancelled",
      }),

      ["waiting", "called", "in-service"].includes(queue.status)
        ? Queue.countDocuments({
            ...baseQuery,
            status: {
              $in: ["waiting", "called", "in-service"],
            },
            queueNumber: {
              $lt: queue.queueNumber,
            },
          })
        : 0,
    ]);

    return res.status(200).json({
      success: true,

      myQueueNumber: queue.queueNumber,
      myStatus: queue.status,

      queueSummary: {
        waiting,
        called,
        inService,
        completed,
        cancelled,
        peopleAhead,
      },
    });
  } catch (error) {
    console.error("Get My Queue Position:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch queue position",
    });
  }
};

export const cancelQueue = async (req, res) => {
  try {
    const { queueId } = req.params;

    const queue = await Queue.findOne({
      _id: queueId,
      userId: req.userId,
    });

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: "Queue not found",
      });
    }

    if (!["waiting", "called"].includes(queue.status)) {
      return res.status(400).json({
        success: false,
        message: "This queue cannot be cancelled.",
      });
    }

    queue.status = "cancelled";
    await queue.save();

    // Notify admin dashboard and customer dashboard
    const io = req.app.get("io");

    if (io) {
      io.to(`salon-${queue.salonId}`).emit("queue-updated", {
        queueId: queue._id,
        status: "cancelled",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Queue cancelled successfully",
      queue,
    });
  } catch (error) {
    console.error("Cancel Queue Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel queue",
    });
  }
};

// ========================================
// ATTACH PAYMENT INFORMATION TO QUEUES
// ========================================

