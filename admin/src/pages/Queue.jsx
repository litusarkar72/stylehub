
import {
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import axios from "axios";
import { io } from "socket.io-client";

import {
  Users,
  Clock,
  PhoneCall,
  CheckCircle,
  RefreshCw,
  Scissors,
  Play,
  Check,
  Crown,
  CreditCard,
  RotateCcw,
  User,
  Wallet,
  CalendarDays,
  AlertCircle,
} from "lucide-react";

import { AdminContext } from "../context/AdminContext";

const DEFAULT_PROFILE_IMAGE =
  "https://placehold.co/100x100?text=User";

const Queue = () => {
  const { backendUrl, token } = useContext(AdminContext);

  const [salon, setSalon] = useState(null);
  const [queue, setQueue] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [actionLoading, setActionLoading] = useState("");
  const [refundLoading, setRefundLoading] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // =========================
  // GET SALON
  // =========================

  const getSalon = useCallback(async () => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/salons/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSalon(response.data.salon);
        return response.data.salon;
      }

      return null;
    } catch (error) {
      console.error(
        "Get salon error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message || "Unable to load salon."
      );

      return null;
    }
  }, [backendUrl, token]);

  // =========================
  // GET QUEUE
  // =========================

  const getQueue = useCallback(
    async (salonId) => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/queue/salon/${salonId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setQueue(response.data.queue || []);
        } else {
          setQueue([]);
        }
      } catch (error) {
        console.error(
          "Get queue error:",
          error.response?.data || error.message
        );

        setErrorMessage(
          error.response?.data?.message || "Unable to load queue."
        );
      }
    },
    [backendUrl, token]
  );

  // =========================
  // LOAD DATA
  // =========================

  const loadData = useCallback(
    async (showRefresh = false) => {
      if (!token) {
        setLoading(false);
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      try {
        const salonData = await getSalon();

        if (salonData?._id) {
          await getQueue(salonData._id);
        } else {
          setQueue([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, getSalon, getQueue]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // =========================
  // SOCKET.IO REAL-TIME
  // =========================

  useEffect(() => {
    if (!salon?._id || !token) return;

    const socket = io(backendUrl, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      socket.emit("join-salon", salon._id);
    });

    socket.on("queue-updated", () => {
      getQueue(salon._id);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket error:", error.message);
    });

    return () => {
      socket.off("connect");
      socket.off("queue-updated");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, [salon?._id, backendUrl, token, getQueue]);

  // =========================
  // CALL NEXT CUSTOMER
  // =========================

  const callNext = async () => {
    if (!salon?._id || actionLoading) return;

    setActionLoading("call-next");

    try {
      const response = await axios.post(
        `${backendUrl}/api/queue/call-next`,
        { salonId: salon._id },
        authConfig
      );

      if (response.data.success) {
        await getQueue(salon._id);
      } else {
        alert(response.data.message || "No waiting customer found.");
      }
    } catch (error) {
      console.error(
        "Call next error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Unable to call next customer."
      );
    } finally {
      setActionLoading("");
    }
  };

  // =========================
  // START SERVICE
  // =========================

  const startService = async (queueId) => {
    if (actionLoading) return;

    setActionLoading(queueId);

    try {
      const response = await axios.post(
        `${backendUrl}/api/queue/start`,
        { queueId },
        authConfig
      );

      if (response.data.success) {
        await getQueue(salon._id);
      } else {
        alert(response.data.message || "Unable to start service.");
      }
    } catch (error) {
      console.error(
        "Start service error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message || "Unable to start service."
      );
    } finally {
      setActionLoading("");
    }
  };

  // =========================
  // COMPLETE SERVICE
  // =========================

  const completeService = async (queueId) => {
    if (actionLoading) return;

    setActionLoading(queueId);

    try {
      const response = await axios.post(
        `${backendUrl}/api/queue/complete`,
        { queueId },
        authConfig
      );

      if (response.data.success) {
        await getQueue(salon._id);
      } else {
        alert(response.data.message || "Unable to complete service.");
      }
    } catch (error) {
      console.error(
        "Complete service error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Unable to complete service."
      );
    } finally {
      setActionLoading("");
    }
  };

  // =========================
  // REFUND PAYMENT
  // =========================

  const refundPayment = async (item) => {
    const queueId = item._id;

    if (!queueId || refundLoading) return;

    const confirmed = window.confirm(
      `Are you sure you want to refund the payment for queue #${item.queueNumber}?`
    );

    if (!confirmed) return;

    setRefundLoading(queueId);

    try {
      const response = await axios.post(
        `${backendUrl}/api/payment/refund/${queueId}`,
        {},
        authConfig
      );

      if (response.data.success) {
        alert(
          response.data.message ||
            "Refund request submitted successfully."
        );

        await getQueue(salon._id);
      } else {
        alert(
          response.data.message || "Unable to process refund."
        );
      }
    } catch (error) {
      console.error(
        "Refund error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Unable to process refund."
      );
    } finally {
      setRefundLoading("");
    }
  };

  // =========================
  // QUEUE COUNTS
  // =========================

  const waitingCount = queue.filter(
    (item) => item.status === "waiting"
  ).length;

  const calledCount = queue.filter(
    (item) => item.status === "called"
  ).length;

  const inServiceCount = queue.filter(
    (item) => item.status === "in-service"
  ).length;

  const completedCount = queue.filter(
    (item) => item.status === "completed"
  ).length;

  const stats = [
    {
      title: "Waiting",
      count: waitingCount,
      icon: Clock,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
    },
    {
      title: "Called",
      count: calledCount,
      icon: PhoneCall,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      title: "In Service",
      count: inServiceCount,
      icon: Scissors,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
    {
      title: "Completed",
      count: completedCount,
      icon: CheckCircle,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
  ];

  // =========================
  // STATUS STYLES
  // =========================

  const statusStyle = {
    waiting:
      "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",

    called:
      "bg-blue-400/10 text-blue-400 border-blue-400/20",

    "in-service":
      "bg-purple-400/10 text-purple-400 border-purple-400/20",

    completed:
      "bg-green-400/10 text-green-400 border-green-400/20",

    cancelled:
      "bg-red-400/10 text-red-400 border-red-400/20",
  };

  const paymentStyle = {
    paid:
      "bg-green-400/10 text-green-400 border-green-400/20",

    created:
      "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",

    processing:
      "bg-blue-400/10 text-blue-400 border-blue-400/20",

    failed:
      "bg-red-400/10 text-red-400 border-red-400/20",

    pending:
      "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  };

  const refundStyle = {
    pending: "text-yellow-400",
    processed: "text-green-400",
    failed: "text-red-400",
    not_requested: "text-gray-500",
  };

  // =========================
  // PAYMENT HELPERS
  // =========================

  const getPayment = (item) => item.payment || null;

  const getAmount = (item) => {
    const payment = getPayment(item);

    if (!payment) return null;

    if (payment.amountInRupees !== undefined) {
      return Number(payment.amountInRupees);
    }

    if (payment.amount !== undefined) {
      return Number(payment.amount) / 100;
    }

    return null;
  };

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) {
      return "—";
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getPaymentStatus = (item) => {
    return (
      getPayment(item)?.status ||
      item.paymentStatus ||
      "pending"
    );
  };

  const getRefundStatus = (item) => {
    return (
      getPayment(item)?.refundStatus ||
      item.refundStatus ||
      "not_requested"
    );
  };

  const canRefund = (item) => {
    return (
      item.status === "cancelled" &&
      getPaymentStatus(item) === "paid" &&
      getRefundStatus(item) === "not_requested"
    );
  };

  // =========================
  // PAYMENT INFORMATION
  // =========================

  const PaymentInformation = ({ item }) => {
    const paymentStatus = getPaymentStatus(item);
    const refundStatus = getRefundStatus(item);

    return (
      <div className="min-w-0">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
            paymentStyle[paymentStatus] ||
            "border-white/10 bg-white/5 text-gray-400"
          }`}
        >
          {paymentStatus.replaceAll("_", " ")}
        </span>

        <p className="mt-2 text-sm font-semibold text-gray-200">
          {formatAmount(getAmount(item))}
        </p>

        {refundStatus !== "not_requested" && (
          <p
            className={`mt-1 text-xs capitalize ${
              refundStyle[refundStatus] || "text-gray-400"
            }`}
          >
            Refund: {refundStatus.replaceAll("_", " ")}
          </p>
        )}
      </div>
    );
  };

  // =========================
  // ACTION BUTTONS
  // =========================

  const ActionButtons = ({ item }) => {
    const isLoading = actionLoading === item._id;
    const isRefunding = refundLoading === item._id;

    return (
      <div className="flex flex-wrap items-center gap-2">
        {item.status === "called" && (
          <button
            type="button"
            onClick={() => startService(item._id)}
            disabled={!!actionLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2.5 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-50"
          >
            <Play size={14} />
            {isLoading ? "Starting..." : "Start Service"}
          </button>
        )}

        {item.status === "in-service" && (
          <button
            type="button"
            onClick={() => completeService(item._id)}
            disabled={!!actionLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-500/10 px-3 py-2.5 text-xs font-semibold text-green-400 transition hover:bg-green-500/20 disabled:opacity-50"
          >
            <Check size={14} />
            {isLoading ? "Completing..." : "Complete"}
          </button>
        )}

        {item.status === "waiting" && (
          <span className="text-xs text-yellow-400">
            Waiting for call
          </span>
        )}

        {item.status === "completed" && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-400">
            <CheckCircle size={14} />
            Completed
          </span>
        )}

        {item.status === "cancelled" && canRefund(item) && (
          <button
            type="button"
            onClick={() => refundPayment(item)}
            disabled={!!refundLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500/10 px-3 py-2.5 text-xs font-semibold text-orange-400 transition hover:bg-orange-500/20 disabled:opacity-50"
          >
            <RotateCcw size={14} />
            {isRefunding ? "Processing..." : "Refund"}
          </button>
        )}

        {item.status === "cancelled" &&
          getRefundStatus(item) === "pending" && (
            <span className="text-xs text-yellow-400">
              Refund Pending
            </span>
          )}

        {item.status === "cancelled" &&
          getRefundStatus(item) === "processed" && (
            <span className="text-xs text-green-400">
              Refunded
            </span>
          )}

        {item.status === "cancelled" &&
          getRefundStatus(item) === "failed" && (
            <span className="text-xs text-red-400">
              Refund Failed
            </span>
          )}

        {item.status === "cancelled" &&
          getPaymentStatus(item) !== "paid" && (
            <span className="text-xs text-gray-500">
              No paid payment
            </span>
          )}
      </div>
    );
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090909] p-6 text-white">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <RefreshCw
              className="mx-auto mb-4 animate-spin text-[#c6a15b]"
              size={32}
            />
            <p className="text-sm text-gray-400">
              Loading queue...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // NO SALON
  // =========================

  if (!salon) {
    return (
      <div className="min-h-screen bg-[#090909] p-4 text-white sm:p-8">
        <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-6 sm:p-8">
          <Crown className="mb-4 text-[#c6a15b]" size={32} />

          <h2 className="text-2xl font-semibold">
            No Salon Found
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            Create or register your salon before managing the queue.
          </p>

          {errorMessage && (
            <p className="mt-4 text-sm text-red-400">
              {errorMessage}
            </p>
          )}

          <button
            type="button"
            onClick={() => loadData(true)}
            className="mt-5 rounded-xl border border-[#c6a15b]/30 px-4 py-3 text-sm text-[#d5b46a]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =========================
  // MAIN UI
  // =========================

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#090909] p-3 text-white sm:p-5 lg:p-8">

      {/* HEADER */}

      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#c6a15b]">
            <Crown size={15} />
            Salon Management
          </div>

          <h1 className="text-2xl font-bold sm:text-3xl">
            Queue Management
          </h1>

          <p className="mt-2 break-words text-sm text-gray-500">
            {salon.name}
            {salon.address && ` · ${salon.address}`}
            {salon.city && `, ${salon.city}`}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm text-gray-300 transition hover:border-[#c6a15b]/40 hover:text-[#d5b46a] disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={callNext}
            disabled={waitingCount === 0 || !!actionLoading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b08a42] to-[#e1c47b] px-5 py-3 text-sm font-bold text-black shadow-lg shadow-[#c6a15b]/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PhoneCall size={17} />
            {actionLoading === "call-next"
              ? "Calling Customer..."
              : "Call Next Customer"}
          </button>
        </div>
      </div>

      {/* ERROR */}

      {errorMessage && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* STATISTICS */}

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-white/[0.07] bg-[#141414] p-4 transition hover:border-[#c6a15b]/30 sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-gray-400 sm:text-sm">
                    {stat.title}
                  </p>

                  <h2 className="mt-3 text-2xl font-bold tabular-nums sm:text-3xl">
                    {stat.count}
                  </h2>
                </div>

                <div className={`rounded-xl p-2.5 sm:p-3 ${stat.bg}`}>
                  <Icon size={21} className={stat.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUEUE CONTAINER */}

      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#141414]">

        {/* QUEUE HEADER */}

        <div className="flex flex-col justify-between gap-3 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center sm:p-5">
          <div>
            <h2 className="text-lg font-semibold">
              Today's Queue
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Manage customer appointments and service progress
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users size={16} className="text-[#c6a15b]" />
            {queue.length} customers
          </div>
        </div>

        {/* EMPTY QUEUE */}

        {queue.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c6a15b]/10">
              <Users size={28} className="text-[#c6a15b]" />
            </div>

            <h3 className="text-lg font-semibold">
              No Customers in Queue
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              New customer bookings will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* =========================
                MOBILE CARDS
            ========================== */}

            <div className="space-y-4 p-3 md:hidden">
              {queue.map((item) => (
                <div
                  key={item._id}
                  className="min-w-0 rounded-xl border border-white/[0.08] bg-[#101010] p-4"
                >
                  {/* CARD HEADER */}

                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-500">
                        Queue Number
                      </p>

                      <h3 className="mt-1 text-xl font-bold text-[#d5b46a]">
                        #{item.queueNumber}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${
                        statusStyle[item.status] ||
                        "border-white/10 bg-white/5 text-gray-400"
                      }`}
                    >
                      {item.status?.replaceAll("_", " ") || "Unknown"}
                    </span>
                  </div>

                  {/* CUSTOMER */}

                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={
                        item.userId?.profileImage ||
                        DEFAULT_PROFILE_IMAGE
                      }
                      alt={item.userId?.name || "Customer"}
                      className="h-12 w-12 shrink-0 rounded-full border border-white/10 object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                      }}
                    />

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-200">
                        {item.userId?.name || "Unknown Customer"}
                      </p>

                      <p className="mt-1 truncate text-xs text-gray-500">
                        {item.userId?.phone || "Phone not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="my-4 border-t border-white/[0.07]" />

                  {/* SERVICE */}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <p className="mb-1 text-xs text-gray-500">
                        Service
                      </p>

                      <p className="break-words text-sm font-medium text-gray-200">
                        {item.serviceId?.name || "Unknown Service"}
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 text-xs text-gray-500">
                        Duration
                      </p>

                      <p className="flex items-center gap-1.5 text-sm text-gray-300">
                        <Clock
                          size={14}
                          className="text-[#c6a15b]"
                        />
                        {item.serviceId?.duration || 0} min
                      </p>
                    </div>
                  </div>

                  <div className="my-4 border-t border-white/[0.07]" />

                  {/* PAYMENT */}

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-xs text-gray-500">
                        <Wallet size={14} />
                        Payment Details
                      </p>

                      <PaymentInformation item={item} />
                    </div>

                    <div className="text-right">
                      <p className="mb-2 text-xs text-gray-500">
                        Payment
                      </p>

                      {canRefund(item) ? (
                        <span className="text-xs text-orange-400">
                          Refund available
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">
                          —
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ACTIONS */}

                  <div className="mt-4 border-t border-white/[0.07] pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </p>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {item.status === "waiting" && (
                        <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 px-3 py-3 text-center text-xs text-yellow-400 sm:col-span-2">
                          Waiting for next customer call
                        </div>
                      )}

                      {item.status === "called" && (
                        <button
                          type="button"
                          onClick={() => startService(item._id)}
                          disabled={!!actionLoading}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-500/10 px-3 py-3 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-50"
                        >
                          <Play size={15} />
                          {actionLoading === item._id
                            ? "Starting..."
                            : "Start Service"}
                        </button>
                      )}

                      {item.status === "in-service" && (
                        <button
                          type="button"
                          onClick={() => completeService(item._id)}
                          disabled={!!actionLoading}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-green-500/10 px-3 py-3 text-sm font-semibold text-green-400 transition hover:bg-green-500/20 disabled:opacity-50"
                        >
                          <Check size={15} />
                          {actionLoading === item._id
                            ? "Completing..."
                            : "Complete Service"}
                        </button>
                      )}

                      {item.status === "cancelled" && canRefund(item) && (
                        <button
                          type="button"
                          onClick={() => refundPayment(item)}
                          disabled={!!refundLoading}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-orange-500/10 px-3 py-3 text-sm font-semibold text-orange-400 transition hover:bg-orange-500/20 disabled:opacity-50"
                        >
                          <RotateCcw size={15} />
                          {refundLoading === item._id
                            ? "Processing Refund..."
                            : "Refund Payment"}
                        </button>
                      )}

                      {item.status === "cancelled" &&
                        getRefundStatus(item) === "pending" && (
                          <div className="rounded-lg bg-yellow-500/10 px-3 py-3 text-center text-xs text-yellow-400">
                            Refund is pending
                          </div>
                        )}

                      {item.status === "cancelled" &&
                        getRefundStatus(item) === "processed" && (
                          <div className="rounded-lg bg-green-500/10 px-3 py-3 text-center text-xs text-green-400">
                            Refund processed
                          </div>
                        )}

                      {item.status === "cancelled" &&
                        getRefundStatus(item) === "failed" && (
                          <div className="rounded-lg bg-red-500/10 px-3 py-3 text-center text-xs text-red-400">
                            Refund failed
                          </div>
                        )}

                      {item.status === "completed" && (
                        <div className="rounded-lg bg-green-500/10 px-3 py-3 text-center text-xs font-semibold text-green-400">
                          <CheckCircle
                            size={14}
                            className="mr-1 inline"
                          />
                          Service Completed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* =========================
                DESKTOP TABLE
            ========================== */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1150px] text-left">
                <thead className="bg-[#0d0d0d]">
                  <tr className="text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-5 py-4 font-semibold">
                      Queue
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Customer
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Service
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Duration
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Payment
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.06]">
                  {queue.map((item) => (
                    <tr
                      key={item._id}
                      className="transition hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-5">
                        <span className="font-bold text-[#d5b46a]">
                          #{item.queueNumber}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              item.userId?.profileImage ||
                              DEFAULT_PROFILE_IMAGE
                            }
                            alt={item.userId?.name || "Customer"}
                            className="h-11 w-11 shrink-0 rounded-full border border-white/10 object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src =
                                DEFAULT_PROFILE_IMAGE;
                            }}
                          />

                          <div>
                            <p className="font-medium text-gray-200">
                              {item.userId?.name || "Unknown"}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {item.userId?.phone || "Phone not provided"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <p className="font-medium text-gray-200">
                          {item.serviceId?.name || "Unknown"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {item.serviceId?.price != null
                            ? `₹${item.serviceId.price}`
                            : "Price not available"}
                        </p>
                      </td>

                      <td className="px-5 py-5 text-sm text-gray-400">
                        <span className="inline-flex items-center gap-2">
                          <Clock size={14} />
                          {item.serviceId?.duration || 0} min
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${
                            statusStyle[item.status] ||
                            "border-white/10 bg-white/5 text-gray-400"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <PaymentInformation item={item} />
                      </td>

                      <td className="px-5 py-5">
                        <ActionButtons item={item} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* FOOTER */}

        <div className="flex flex-col justify-between gap-2 border-t border-white/[0.06] bg-[#101010] px-5 py-4 text-xs text-gray-500 sm:flex-row sm:items-center">
          <p>SalonPro Management</p>

          <p className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            Live queue updates enabled
          </p>
        </div>
      </div>
    </div>
  );
};

export default Queue;
