import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import axios from "axios";
import { AdminContext } from "../context/AdminContext";
import { io } from "socket.io-client";

import {
  Users,
  PhoneCall,
  Scissors,
  CheckCircle2,
  CalendarDays,
  Clock,
  RefreshCw,
  Crown,
  Sparkles,
  CreditCard,
  Wallet,
} from "lucide-react";

const DEFAULT_PROFILE_IMAGE =
  "https://placehold.co/100x100?text=User";

const INITIAL_STATS = {
  waiting: 0,
  called: 0,
  inService: 0,
  completed: 0,
  cancelled: 0,
  total: 0,
};

const Dashboard = () => {
  const { backendUrl, token, admin } = useContext(AdminContext);

  const [salon, setSalon] = useState(null);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // =========================
  // AUTH HEADERS
  // =========================

  const getHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  // =========================
  // GET SALON DETAILS
  // =========================

  const fetchSalon = useCallback(async () => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/salons/my`,
        {
          headers: getHeaders(),
        }
      );

      if (response.data.success) {
        setSalon(response.data.salon);
        return response.data.salon;
      }

      return null;
    } catch (error) {
      console.error(
        "Salon error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Unable to load salon details."
      );

      return null;
    }
  }, [backendUrl, getHeaders]);

  // =========================
  // GET DASHBOARD STATISTICS
  // =========================

  const fetchStats = useCallback(
    async (salonId) => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/queue/dashboard/${salonId}`,
          {
            headers: getHeaders(),
          }
        );

        if (response.data.success) {
          setStats({
            ...INITIAL_STATS,
            ...response.data.stats,
          });
        }
      } catch (error) {
        console.error(
          "Stats error:",
          error.response?.data || error.message
        );
      }
    },
    [backendUrl, getHeaders]
  );

  // =========================
  // GET CURRENT QUEUE
  // =========================

  const fetchQueue = useCallback(
    async (salonId) => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/queue/salon/${salonId}`,
          {
            headers: getHeaders(),
          }
        );

        if (response.data.success) {
          setQueue(response.data.queue || []);
        }
      } catch (error) {
        console.error(
          "Queue error:",
          error.response?.data || error.message
        );
      }
    },
    [backendUrl, getHeaders]
  );

  // =========================
  // FETCH DASHBOARD DATA
  // =========================

  const fetchDashboard = useCallback(
    async (showRefreshing = false) => {
      if (!token) {
        setLoading(false);
        return;
      }

      if (showRefreshing) {
        setRefreshing(true);
      }

      try {
        setErrorMessage("");

        let salonData = salon;

        if (!salonData?._id) {
          salonData = await fetchSalon();
        }

        if (!salonData?._id) {
          setQueue([]);
          return;
        }

        await Promise.all([
          fetchStats(salonData._id),
          fetchQueue(salonData._id),
        ]);
      } catch (error) {
        console.error("Dashboard error:", error);
        setErrorMessage("Unable to load dashboard data.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      token,
      salon,
      fetchSalon,
      fetchStats,
      fetchQueue,
    ]
  );

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // =========================
  // SOCKET.IO REAL-TIME UPDATE
  // =========================

  useEffect(() => {
    if (!salon?._id || !token) return;

    const socket = io(backendUrl, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);

      socket.emit("join-salon", salon._id);
    });

    socket.on("queue-updated", () => {
      console.log("Queue updated. Refreshing dashboard...");

      fetchStats(salon._id);
      fetchQueue(salon._id);
    });

    socket.on("connect_error", (error) => {
      console.error(
        "Socket connection error:",
        error.message
      );
    });

    return () => {
      socket.off("connect");
      socket.off("queue-updated");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, [
    salon?._id,
    backendUrl,
    token,
    fetchStats,
    fetchQueue,
  ]);

  // =========================
  // MANUAL REFRESH
  // =========================

  const handleRefresh = () => {
    fetchDashboard(true);
  };

  // =========================
  // QUEUE STATUS STYLES
  // =========================

  const getStatusStyle = (status) => {
    const styles = {
      waiting:
        "border-amber-500/20 bg-amber-500/10 text-amber-400",

      called:
        "border-blue-500/20 bg-blue-500/10 text-blue-400",

      "in-service":
        "border-purple-500/20 bg-purple-500/10 text-purple-400",

      completed:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",

      cancelled:
        "border-red-500/20 bg-red-500/10 text-red-400",
    };

    return (
      styles[status] ||
      "border-gray-500/20 bg-gray-500/10 text-gray-400"
    );
  };

  // =========================
  // PAYMENT STATUS STYLES
  // =========================

  const getPaymentStyle = (status) => {
    const styles = {
      paid:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",

      created:
        "border-amber-500/20 bg-amber-500/10 text-amber-400",

      processing:
        "border-blue-500/20 bg-blue-500/10 text-blue-400",

      failed:
        "border-red-500/20 bg-red-500/10 text-red-400",

      pending:
        "border-amber-500/20 bg-amber-500/10 text-amber-400",
    };

    return (
      styles[status] ||
      "border-gray-500/20 bg-gray-500/10 text-gray-400"
    );
  };

  // =========================
  // REFUND STATUS STYLES
  // =========================

  const getRefundStyle = (status) => {
    const styles = {
      pending:
        "text-amber-400",

      processed:
        "text-emerald-400",

      failed:
        "text-red-400",

      not_requested:
        "text-gray-500",
    };

    return styles[status] || "text-gray-500";
  };

  // =========================
  // FORMAT PAYMENT AMOUNT
  // =========================

  const getPaymentAmount = (payment) => {
    if (!payment) return null;

    if (payment.amountInRupees !== undefined) {
      return Number(payment.amountInRupees);
    }

    if (payment.amount !== undefined) {
      return Number(payment.amount) / 100;
    }

    return null;
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) {
      return "—";
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // =========================
  // STATISTICS CARDS
  // =========================

  const statCards = [
    {
      title: "Waiting",
      value: stats.waiting,
      icon: Users,
      color: "text-amber-400",
      background: "bg-amber-400/10",
    },
    {
      title: "Called",
      value: stats.called,
      icon: PhoneCall,
      color: "text-blue-400",
      background: "bg-blue-400/10",
    },
    {
      title: "In Service",
      value: stats.inService,
      icon: Scissors,
      color: "text-purple-400",
      background: "bg-purple-400/10",
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-emerald-400",
      background: "bg-emerald-400/10",
    },
    {
      title: "Total Today",
      value: stats.total,
      icon: CalendarDays,
      color: "text-[#d5b46a]",
      background: "bg-[#d5b46a]/10",
    },
  ];

  // =========================
  // PAYMENT DISPLAY
  // =========================

  const PaymentDetails = ({ item }) => {
    const payment = item.payment || null;

    const paymentStatus =
      payment?.status || item.paymentStatus || "pending";

    const refundStatus =
      payment?.refundStatus || item.refundStatus;

    const amount = getPaymentAmount(payment);

    return (
      <div className="min-w-[110px]">
        <span
          className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${getPaymentStyle(
            paymentStatus
          )}`}
        >
          {paymentStatus.replaceAll("_", " ")}
        </span>

        <p className="mt-2 text-sm font-semibold text-gray-200">
          {formatCurrency(amount)}
        </p>

        {refundStatus &&
          refundStatus !== "not_requested" && (
            <p
              className={`mt-1 text-xs capitalize ${getRefundStyle(
                refundStatus
              )}`}
            >
              Refund: {refundStatus.replaceAll("_", " ")}
            </p>
          )}
      </div>
    );
  };

  // =========================
  // LOADING SCREEN
  // =========================

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#090909]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#c6a15b] border-t-transparent" />

          <p className="text-sm tracking-wide text-gray-400">
            Preparing your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // MAIN DASHBOARD
  // =========================

  return (
    <div className="min-h-screen bg-[#090909] p-4 text-white sm:p-6 lg:p-8">

      {/* HEADER */}

      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#c6a15b]">
            <Crown size={15} />
            Premium Owner Panel
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Dashboard Overview
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Welcome back, {admin?.name || "Salon Owner"}
          </p>

          {salon && (
            <p className="mt-1 flex items-center gap-2 text-sm text-[#c6a15b]">
              <Sparkles size={14} />
              {salon.name}
            </p>
          )}
        </div>

        {/* REFRESH ONLY */}

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 self-start rounded-xl border border-[#c6a15b]/30 bg-[#171717] px-4 py-3 text-sm font-medium text-[#d5b46a] transition hover:bg-[#c6a15b]/10 disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />

          {refreshing ? "Refreshing..." : "Refresh Dashboard"}
        </button>
      </div>

      {/* ERROR MESSAGE */}

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {errorMessage}
        </div>
      )}

      {/* STATISTICS */}

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="group rounded-2xl border border-white/[0.07] bg-[#141414] p-4 transition duration-300 hover:border-[#c6a15b]/40 sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-gray-400 sm:text-sm">
                  {card.title}
                </p>

                <div
                  className={`rounded-xl p-2 sm:p-3 ${card.background}`}
                >
                  <Icon
                    size={18}
                    className={card.color}
                  />
                </div>
              </div>

              <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
                {card.value ?? 0}
              </h2>

              <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
                <div className="h-full w-1/3 rounded-full bg-[#c6a15b]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* QUEUE SECTION */}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-2xl shadow-black/20">

        {/* QUEUE HEADER */}

        <div className="flex flex-col justify-between gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">
                Today's Queue
              </h2>

              <span className="rounded-full border border-[#c6a15b]/30 bg-[#c6a15b]/10 px-3 py-1 text-xs font-semibold text-[#d5b46a]">
                {queue.length} Customers
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              View customer, queue and payment information
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Live updates enabled
          </div>
        </div>

        {/* EMPTY QUEUE */}

        {queue.length === 0 ? (
          <div className="p-10 text-center sm:p-12">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c6a15b]/10">
              <Users
                size={26}
                className="text-[#c6a15b]"
              />
            </div>

            <h3 className="font-semibold text-gray-200">
              No Customers Yet
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Your customer queue will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* MOBILE QUEUE CARDS */}

            <div className="space-y-4 p-4 md:hidden">
              {queue.map((item) => (
                <div
                  key={item._id}
                  className="rounded-xl border border-white/10 bg-[#1a1a1a] p-4"
                >
                  {/* QUEUE NUMBER AND STATUS */}

                  <div className="mb-4 flex items-center justify-between gap-2">
                    <span className="text-lg font-bold text-[#d5b46a]">
                      #{item.queueNumber}
                    </span>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${getStatusStyle(
                        item.status
                      )}`}
                    >
                      {item.status?.replaceAll("_", " ") || "Unknown"}
                    </span>
                  </div>

                  {/* CUSTOMER */}

                  <div className="flex items-center gap-3">
                    <img
                      src={
                        item.userId?.profileImage ||
                        DEFAULT_PROFILE_IMAGE
                      }
                      alt={item.userId?.name || "Customer"}
                      className="h-12 w-12 shrink-0 rounded-full border border-white/10 object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          DEFAULT_PROFILE_IMAGE;
                      }}
                    />

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-100">
                        {item.userId?.name || "Unknown Customer"}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {item.userId?.phone || "No phone"}
                      </p>
                    </div>
                  </div>

                  <div className="my-4 border-t border-white/10" />

                  {/* SERVICE DETAILS */}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="mb-1 text-xs text-gray-500">
                        Service
                      </p>

                      <p className="text-sm font-medium text-gray-200">
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

                  <div className="my-4 border-t border-white/10" />

                  {/* PAYMENT DETAILS */}

                  <div>
                    <p className="mb-2 text-xs text-gray-500">
                      Payment Information
                    </p>

                    <PaymentDetails item={item} />
                  </div>

                  {/* DISPLAY ONLY */}

                  <div className="mt-4 flex items-center justify-end border-t border-white/10 pt-3">
                    <span className="text-xs text-gray-500">
                      View only
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1050px] text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-[#1b1b1b] text-xs uppercase tracking-wider text-gray-400">
                    <th className="px-5 py-5">Queue</th>
                    <th className="px-5 py-5">Customer Details</th>
                    <th className="px-5 py-5">Service</th>
                    <th className="px-5 py-5">Duration</th>
                    <th className="px-5 py-5">Status</th>
                    <th className="px-5 py-5">Payment</th>
                    <th className="px-5 py-5">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {queue.map((item) => (
                    <tr
                      key={item._id}
                      className="border-b border-white/5 transition hover:bg-white/[0.02]"
                    >
                      {/* QUEUE */}

                      <td className="px-5 py-5">
                        <span className="font-bold text-[#d5b46a]">
                          #{item.queueNumber}
                        </span>
                      </td>

                      {/* CUSTOMER */}

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

                          <div className="min-w-0">
                            <p className="font-semibold text-gray-100">
                              {item.userId?.name || "Unknown"}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {item.userId?.phone || "No phone"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* SERVICE */}

                      <td className="px-5 py-5 text-sm text-gray-300">
                        {item.serviceId?.name || "Unknown Service"}
                      </td>

                      {/* DURATION */}

                      <td className="px-5 py-5">
                        <span className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock
                            size={15}
                            className="text-[#c6a15b]"
                          />

                          {item.serviceId?.duration || 0} min
                        </span>
                      </td>

                      {/* QUEUE STATUS */}

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${getStatusStyle(
                            item.status
                          )}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />

                          {item.status?.replaceAll("_", " ") ||
                            "Unknown"}
                        </span>
                      </td>

                      {/* PAYMENT */}

                      <td className="px-5 py-5">
                        <PaymentDetails item={item} />
                      </td>

                      {/* ACTION - DISPLAY ONLY */}

                      <td className="px-5 py-5">
                        <span className="text-xs text-gray-500">
                          View only
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* FOOTER */}

        <div className="flex flex-col justify-between gap-2 border-t border-white/5 bg-[#101010] px-5 py-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:px-6">
          <p>SalonPro Premium Management</p>

          <p className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live queue updates enabled
          </p>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;