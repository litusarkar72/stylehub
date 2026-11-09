
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";
import axios from "axios";
import { socket } from "../socket";

import {
  MapPin,
  History,
  Clock,
  Ticket,
  RefreshCw,
  Scissors,
  CalendarDays,
  Store,
  Search,
  Sparkles,
  Users,
  CheckCircle,
  XCircle,
  Hourglass,
  IndianRupee,
  AlertCircle,
  ArrowUpRight,
  CreditCard,
  RotateCcw,
  Receipt,
} from "lucide-react";

import { useAppContext } from "../context/AppContext";

const API =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

// ========================================
// QUEUE STATUS CONFIGURATION
// ========================================

const statusConfig = {
  waiting: {
    label: "Waiting",
    icon: Hourglass,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },

  called: {
    label: "Called",
    icon: Users,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },

  "in-service": {
    label: "In Service",
    icon: Scissors,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },

  completed: {
    label: "Completed",
    icon: CheckCircle,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },

  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

// ========================================
// PAYMENT STATUS CONFIGURATION
// ========================================

const paymentStatusConfig = {
  paid: {
    label: "Paid",
    icon: CheckCircle,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },

  created: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },

  processing: {
    label: "Processing",
    icon: Hourglass,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },

  failed: {
    label: "Failed",
    icon: XCircle,
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

const refundStatusConfig = {
  pending: {
    label: "Refund Initiated",
    icon: Clock,
    color: "text-amber-800",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },

  processed: {
    label: "Refund Processed",
    icon: CheckCircle,
    color: "text-emerald-800",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },

  failed: {
    label: "Refund Failed",
    icon: AlertCircle,
    color: "text-red-800",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

// ========================================
// HELPER FUNCTIONS
// ========================================

const formatStatus = (status = "") => {
  return statusConfig[status]?.label || "Unknown";
};

const formatDuration = (minutes = 0) => {
  const value = Number(minutes) || 0;

  if (value < 60) {
    return `${value} min`;
  }

  const hours = Math.floor(value / 60);
  const remaining = value % 60;

  return remaining
    ? `${hours} hr ${remaining} min`
    : `${hours} ${hours === 1 ? "hour" : "hours"}`;
};

const formatDate = (date) => {
  if (!date) return "—";

  // queueDate is stored as YYYY-MM-DD.
  if (typeof date === "string") {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (match) {
      const month = new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3])
      ).toLocaleString("en-IN", {
        month: "short",
      });

      return `${match[3]} ${month} ${match[1]}`;
    }
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAmount = (amount) => {
  if (amount == null || Number.isNaN(Number(amount))) {
    return "Not available";
  }

  return Number(amount).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
};

// ========================================
// PAYMENT INFORMATION
// ========================================

const getPaymentInfo = (queue) => {
  const payment =
    queue.payment ||
    (queue.paymentId &&
    typeof queue.paymentId === "object"
      ? queue.paymentId
      : null);

  if (!payment) return null;

  // Payment.amount is stored in paise.
  const amount =
    payment.amountInRupees != null
      ? Number(payment.amountInRupees)
      : payment.amount != null
        ? Number(payment.amount) / 100
        : null;

  // refundedAmount is also stored in paise.
  const refundAmount =
    payment.refundedAmount != null
      ? Number(payment.refundedAmount) / 100
      : null;

  return {
    amount,
    refundAmount,

    paymentStatus: (
      payment.status ||
      queue.paymentStatus ||
      "not available"
    ).toLowerCase(),

    refundStatus: (
      payment.refundStatus ||
      queue.refundStatus ||
      "not_requested"
    ).toLowerCase(),

    method:
      payment.paymentMethod ||
      queue.paymentMethod ||
      "Razorpay",

    transactionId:
      payment.razorpayPaymentId ||
      payment.transactionId ||
      null,

    refundId: payment.refundId || null,

    paidAt: payment.paidAt || null,

    refundedAt: payment.refundedAt || null,
  };
};

// ========================================
// QUEUE STATUS BADGE
// ========================================

const QueueStatusBadge = ({ status }) => {
  const config = statusConfig[status] || {
    label: "Unknown",
    icon: AlertCircle,
    color: "text-gray-600",
    bg: "bg-gray-100",
    border: "border-gray-200",
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold ${config.bg} ${config.color} ${config.border}`}
    >
      <Icon size={15} />
      {config.label}
    </span>
  );
};

// ========================================
// PAYMENT STATUS BADGE
// ========================================

const PaymentBadge = ({ status }) => {
  const config = paymentStatusConfig[status] || {
    label:
      status === "not available"
        ? "Not Available"
        : status || "Unknown",
    icon: AlertCircle,
    color: "text-gray-600",
    bg: "bg-gray-100",
    border: "border-gray-200",
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${config.color} ${config.bg} ${config.border}`}
    >
      <Icon size={14} />
      {config.label}
    </span>
  );
};

// ========================================
// CUSTOMER REFUND INFORMATION
// ========================================

const CustomerRefundStatus = ({ payment }) => {
  if (!payment) return null;

  const status = payment.refundStatus;

  if (!status || status === "not_requested") {
    return null;
  }

  const config = refundStatusConfig[status];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className={`mt-5 rounded-2xl border p-4 sm:p-5 ${config.bg} ${config.border}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
          <Icon size={22} className={config.color} />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className={`font-bold ${config.color}`}>
            {config.label}
          </h4>

          {status === "pending" && (
            <p className="mt-2 text-sm leading-6 text-gray-700">
              Your refund has been initiated successfully
              through Razorpay. Your money will be credited
              to your original payment method within 5–7
              working days, depending on your bank and
              payment method.
            </p>
          )}

          {status === "processed" && (
            <p className="mt-2 text-sm leading-6 text-gray-700">
              Razorpay has processed your refund successfully.
              Please check your original payment method for
              the credited amount. Your bank may take
              additional time to display the transaction.
            </p>
          )}

          {status === "failed" && (
            <p className="mt-2 text-sm leading-6 text-gray-700">
              Your refund could not be processed. Please
              contact the salon for assistance.
            </p>
          )}

          {payment.refundId && (
            <p className="mt-3 break-all text-xs text-gray-500">
              Refund ID: {payment.refundId}
            </p>
          )}

          {payment.refundedAt && (
            <p className="mt-1 text-xs text-gray-500">
              Last updated: {formatDate(payment.refundedAt)}
            </p>
          )}
        </div>
      </div>

      {payment.refundAmount != null && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-300/50 pt-4">
          <span className="text-sm font-medium text-gray-600">
            Refunded Amount
          </span>

          <span className="flex items-center font-bold text-gray-900">
            <IndianRupee size={16} />
            {formatAmount(payment.refundAmount)}
          </span>
        </div>
      )}
    </div>
  );
};

// ========================================
// PAYMENT DETAILS CARD
// ========================================

const PaymentDetails = ({ queue }) => {
  const payment = getPaymentInfo(queue);

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-[#fafafa] p-4 sm:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 font-bold text-gray-900">
          <CreditCard
            size={19}
            className="text-[#a77c32]"
          />
          Payment Details
        </h4>

        <PaymentBadge
          status={payment?.paymentStatus || "not available"}
        />
      </div>

      {!payment ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
          <CreditCard
            size={28}
            className="mx-auto text-gray-400"
          />

          <p className="mt-3 text-sm font-medium text-gray-600">
            Payment information is not available.
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Please check again later.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Detail
              icon={IndianRupee}
              label="Payment Amount"
              value={
                payment.amount != null
                  ? `₹${formatAmount(payment.amount)}`
                  : "Not available"
              }
            />

            <Detail
              icon={CreditCard}
              label="Payment Method"
              value={payment.method}
            />

            <Detail
              icon={Receipt}
              label="Transaction ID"
              value={payment.transactionId || "Not available"}
            />

            <Detail
              icon={RotateCcw}
              label="Refund ID"
              value={payment.refundId || "—"}
            />
          </div>

          {payment.paidAt && (
            <p className="mt-4 text-xs text-gray-500">
              Payment date: {formatDate(payment.paidAt)}
            </p>
          )}

          <CustomerRefundStatus payment={payment} />
        </>
      )}
    </section>
  );
};

// ========================================
// MAIN COMPONENT
// ========================================

export default function QueueHistory() {
  const { token, isAuthenticated } = useAppContext();

  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  // ========================================
  // FETCH CUSTOMER HISTORY
  // ========================================

  const fetchHistory = useCallback(
    async (manual = false) => {
      if (!isAuthenticated || !token) {
        setQueues([]);
        setError("Please log in to view your queue history.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (manual) {
        setRefreshing(true);
      }

      setError("");

      try {
        const response = await axios.get(
          `${API}/api/queue/my-history`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "Unable to load queue history."
          );
        }

        const history = Array.isArray(response.data.queues)
          ? response.data.queues
          : [];

        setQueues(history);
      } catch (err) {
        console.error(
          "Queue history error:",
          err.response?.data || err
        );

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load queue history."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated, token]
  );

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ========================================
  // AUTOMATIC REFRESH EVERY 15 SECONDS
  // ========================================

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const intervalId = setInterval(() => {
      fetchHistory();
    }, 15000);

    return () => clearInterval(intervalId);
  }, [fetchHistory, isAuthenticated, token]);

  // ========================================
  // SOCKET.IO REAL-TIME UPDATES
  // ========================================

  const customerSalonIds = useMemo(() => {
    return [
      ...new Set(
        queues
          .map((item) => {
            if (
              item.salonId &&
              typeof item.salonId === "object"
            ) {
              return item.salonId._id;
            }

            return item.salonId;
          })
          .filter(Boolean)
          .map(String)
      ),
    ];
  }, [queues]);

  useEffect(() => {
    if (!customerSalonIds.length) return;

    if (!socket.connected) {
      socket.connect();
    }

    const handleQueueUpdated = () => {
      fetchHistory();
    };

    socket.on("queue-updated", handleQueueUpdated);

    customerSalonIds.forEach((salonId) => {
      socket.emit("join-salon", salonId);
    });

    return () => {
      socket.off("queue-updated", handleQueueUpdated);

      customerSalonIds.forEach((salonId) => {
        socket.emit("leave-salon", salonId);
      });
    };
  }, [customerSalonIds, fetchHistory]);

  // ========================================
  // STATISTICS
  // ========================================

  const counts = useMemo(
    () => ({
      all: queues.length,

      waiting: queues.filter(
        (queue) => queue.status === "waiting"
      ).length,

      called: queues.filter(
        (queue) => queue.status === "called"
      ).length,

      "in-service": queues.filter(
        (queue) => queue.status === "in-service"
      ).length,

      completed: queues.filter(
        (queue) => queue.status === "completed"
      ).length,

      cancelled: queues.filter(
        (queue) => queue.status === "cancelled"
      ).length,
    }),
    [queues]
  );

  // ========================================
  // SEARCH AND FILTER
  // ========================================

  const filteredQueues = useMemo(() => {
    return queues.filter((queue) => {
      const salon =
        typeof queue.salonId === "object"
          ? queue.salonId?.name || ""
          : "";

      const service =
        typeof queue.serviceId === "object"
          ? queue.serviceId?.name || ""
          : "";

      const text = search.trim().toLowerCase();

      const matchesSearch =
        salon.toLowerCase().includes(text) ||
        service.toLowerCase().includes(text) ||
        String(queue.queueNumber || "").includes(text);

      const matchesStatus =
        filter === "all" || queue.status === filter;

      return matchesSearch && matchesStatus;
    });
  }, [queues, filter, search]);

  const filters = [
    { value: "all", label: "All Records" },
    { value: "waiting", label: "Waiting" },
    { value: "called", label: "Called" },
    { value: "in-service", label: "In Service" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  // ========================================
  // LOADING SCREEN
  // ========================================

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#f6f7f9] px-4">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c6a15b]/10">
            <RefreshCw
              size={28}
              className="animate-spin text-[#b38b42]"
            />
          </div>

          <p className="mt-4 font-semibold text-gray-700">
            Loading your queue history...
          </p>

          <p className="mt-1 text-sm text-gray-400">
            Please wait a moment
          </p>
        </div>
      </main>
    );
  }

  // ========================================
  // LOGIN REQUIRED
  // ========================================

  if (!isAuthenticated || !token) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#f6f7f9] px-4">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c6a15b]/10">
            <History size={30} className="text-[#b38b42]" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Login Required
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Log in to see your previous salon visits and queue records.
          </p>

          <Link
            to="/login"
            className="mt-6 inline-flex rounded-xl bg-[#17191f] px-6 py-3 font-semibold text-white transition hover:bg-gray-700"
          >
            Log in
          </Link>
        </div>
      </main>
    );
  }

  // ========================================
  // MAIN UI
  // ========================================

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f6f7f9] px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">

        {/* PREMIUM HEADER */}

        <section className="relative mb-8 overflow-hidden rounded-3xl bg-[#17191f] p-5 text-white shadow-xl sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border-[35px] border-[#c6a15b]/10" />

          <div className="pointer-events-none absolute -bottom-24 right-40 h-64 w-64 rounded-full bg-[#c6a15b]/10 blur-3xl" />

          <div className="relative z-10 flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-[#c6a15b]/30 bg-[#c6a15b]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[2px] text-[#e2c27e]">
                <Sparkles size={14} />
                My StyleHub Account
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
                My Queue History
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
                Your salon journey, all in one place. View your
                previous visits, booking details, payments and
                refund status.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <History size={16} className="text-[#c6a15b]" />
                  Booking History
                </span>

                <span className="h-1 w-1 rounded-full bg-gray-600" />

                <span className="flex items-center gap-2">
                  <Ticket size={16} className="text-[#c6a15b]" />
                  {queues.length} Total Records
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchHistory(true)}
              disabled={refreshing}
              className="relative z-10 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c6a15b] px-6 py-3.5 font-semibold text-[#17191f] shadow-lg transition hover:bg-[#d8b975] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh History"}
            </button>
          </div>
        </section>

        {/* ERROR MESSAGE */}

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"
          >
            <AlertCircle size={21} className="mt-0.5 shrink-0" />

            <div className="min-w-0">
              <p className="font-semibold">{error}</p>

              <button
                type="button"
                onClick={() => fetchHistory(true)}
                className="mt-2 text-sm font-semibold underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* STATISTICS */}

        <section className="mb-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Booking Overview
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              A quick summary of your salon visits
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
            {[
              {
                label: "Total Records",
                value: counts.all,
                icon: History,
                color: "text-gray-700",
                bg: "bg-gray-100",
                filter: "all",
              },
              {
                label: "Waiting",
                value: counts.waiting,
                icon: Hourglass,
                color: "text-amber-700",
                bg: "bg-amber-100",
                filter: "waiting",
              },
              {
                label: "Called",
                value: counts.called,
                icon: Users,
                color: "text-blue-700",
                bg: "bg-blue-100",
                filter: "called",
              },
              {
                label: "In Service",
                value: counts["in-service"],
                icon: Scissors,
                color: "text-purple-700",
                bg: "bg-purple-100",
                filter: "in-service",
              },
              {
                label: "Completed",
                value: counts.completed,
                icon: CheckCircle,
                color: "text-emerald-700",
                bg: "bg-emerald-100",
                filter: "completed",
              },
              {
                label: "Cancelled",
                value: counts.cancelled,
                icon: XCircle,
                color: "text-red-700",
                bg: "bg-red-100",
                filter: "cancelled",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.filter}
                  type="button"
                  onClick={() => setFilter(item.filter)}
                  className={`min-w-0 rounded-2xl border p-3 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-5 ${
                    filter === item.filter
                      ? "border-[#c6a15b] bg-[#fffaf0]"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${item.bg}`}>
                      <Icon size={20} className={item.color} />
                    </div>

                    <ArrowUpRight
                      size={17}
                      className="text-gray-300"
                    />
                  </div>

                  <p className="mt-4 text-2xl font-bold text-gray-900 sm:mt-5">
                    {item.value}
                  </p>

                  <p className="mt-1 text-xs font-medium text-gray-500 sm:text-sm">
                    {item.label}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* SEARCH AND FILTER */}

        <section className="mb-7 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold text-gray-900">
                Your Bookings
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Search and filter your previous salon visits
              </p>
            </div>

            <div className="relative w-full lg:max-w-md">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search salon, service or queue number..."
                className="w-full rounded-xl border border-gray-200 bg-[#f8f9fb] py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#c6a15b] focus:ring-2 focus:ring-[#c6a15b]/10"
              />
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  filter === item.value
                    ? "bg-[#17191f] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {item.label}

                <span className="ml-2 opacity-70">
                  {counts[item.value]}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* VISIT RECORDS HEADING */}

        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Your Salon Visits
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Showing {filteredQueues.length} of {queues.length} records
            </p>
          </div>

          <span className="hidden items-center gap-2 text-xs font-medium text-gray-500 sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#c6a15b]" />
            Booking Records
          </span>
        </div>

        {/* EMPTY STATE */}

        {!error && filteredQueues.length === 0 && (
          <div className="rounded-3xl border border-gray-200 bg-white px-5 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c6a15b]/10">
              <Ticket size={30} className="text-[#b38b42]" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-gray-900">
              {queues.length === 0
                ? "No Queue History Yet"
                : "No Matching Records"}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              {queues.length === 0
                ? "Your previous salon bookings will appear here when you join a salon queue."
                : "Try changing your search keyword or selecting a different status."}
            </p>

            {search || filter !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="mt-5 rounded-xl bg-[#17191f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                to="/services"
                className="mt-5 inline-flex rounded-xl bg-[#17191f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700"
              >
                Explore Services
              </Link>
            )}
          </div>
        )}

        {/* QUEUE HISTORY CARDS */}

        <div className="space-y-5">
          {filteredQueues.map((queue) => {
            const salon =
              queue.salonId &&
              typeof queue.salonId === "object"
                ? queue.salonId
                : null;

            const service =
              queue.serviceId &&
              typeof queue.serviceId === "object"
                ? queue.serviceId
                : null;

            const isActive = [
              "waiting",
              "called",
              "in-service",
            ].includes(queue.status);

            return (
              <article
                key={queue._id}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:border-[#c6a15b]/50 hover:shadow-lg"
              >
                {/* GOLD TOP BORDER */}

                <div className="h-1 w-full bg-gradient-to-r from-[#a77c32] via-[#e2c27e] to-transparent" />

                <div className="p-4 sm:p-6">

                  {/* CARD HEADER */}

                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#17191f] text-[#e2c27e] sm:h-16 sm:w-16">
                        <Scissors size={26} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold text-gray-900">
                          {service?.name || "Salon Service"}
                        </h3>

                        <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                          <Store size={15} />
                          <span className="truncate">
                            {salon?.name || "Unknown Salon"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <QueueStatusBadge status={queue.status} />
                  </div>

                  <div className="my-6 border-t border-dashed border-gray-200" />

                  {/* BOOKING DETAILS */}

                  <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <Detail
                      icon={Ticket}
                      label="Queue Number"
                      value={`#${queue.queueNumber ?? "—"}`}
                    />

                    <Detail
                      icon={CalendarDays}
                      label="Queue Date"
                      value={formatDate(queue.queueDate)}
                    />

                    <Detail
                      icon={Clock}
                      label="Joined At"
                      value={formatTime(
                        queue.joinedAt || queue.createdAt
                      )}
                    />

                    <Detail
                      icon={IndianRupee}
                      label="Service Price"
                      value={
                        service?.price != null
                          ? `₹${service.price}`
                          : "Not available"
                      }
                    />

                    <Detail
                      icon={Scissors}
                      label="Service Duration"
                      value={
                        service?.duration != null
                          ? formatDuration(service.duration)
                          : "Not available"
                      }
                    />

                    <Detail
                      icon={MapPin}
                      label="Salon Location"
                      value={
                        salon?.address
                          ? [salon.address, salon.city]
                              .filter(Boolean)
                              .join(", ")
                          : "Not available"
                      }
                    />
                  </div>

                  {/* PAYMENT DETAILS */}

                  <PaymentDetails queue={queue} />

                  {/* CARD FOOTER */}

                  <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="break-all text-xs text-gray-400">
                      Booking ID: {queue._id}
                    </span>

                    {isActive && (
                      <Link
                        to={`/my-queue/${queue._id}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#17191f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 sm:w-fit"
                      >
                        View Live Queue
                        <ArrowUpRight size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* FOOTER */}

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-gray-200 py-5 text-xs text-gray-400 sm:flex-row">
          <p>StyleHub · Your Salon Journey</p>
          <p>Queue History & Booking Records</p>
        </div>
      </div>
    </main>
  );
}

// ========================================
// REUSABLE DETAIL COMPONENT
// ========================================

const Detail = ({ icon: Icon, label, value }) => {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f7f5f0] text-[#a77c32]">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
        </p>

        <p className="mt-1 break-all text-sm font-semibold text-gray-800">
          {value}
        </p>
      </div>
    </div>
  );
};
