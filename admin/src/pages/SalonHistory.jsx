
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  History,
  RefreshCw,
  Mail,
  Phone,
  Scissors,
  CalendarDays,
  Ticket,
  Clock,
  MapPin,
  Search,
  AlertCircle,
  IndianRupee,
  CheckCircle,
  XCircle,
  Users,
  ArrowUpRight,
  Hourglass,
  Sparkles,
  CreditCard,
  Receipt,
  RotateCcw,
} from "lucide-react";

import { useAdminContext } from "../context/AdminContext";

const DEFAULT_PROFILE_IMAGE =
  "https://placehold.co/100x100?text=User";

const SalonHistory = () => {
  const { backendUrl, token, admin } = useAdminContext();

  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // =====================================
  // GET SALON ID
  // =====================================

  const salonId =
    typeof admin?.salonId === "object"
      ? admin?.salonId?._id
      : admin?.salonId ||
        admin?.salon?._id ||
        admin?.salonDetails?._id ||
        admin?.salonDetails?.salonId ||
        null;

  // =====================================
  // FETCH SALON HISTORY
  // =====================================

  const fetchHistory = useCallback(
    async (refresh = false) => {
      if (!token) {
        setError("Admin login required. Please log in again.");
        setQueues([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!salonId) {
        setError("Salon ID is missing from admin details.");
        setQueues([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await axios.get(
          `${backendUrl}/api/queue/salon-history/${salonId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
          }
        );

        if (response.data.success) {
          setQueues(response.data.queues || []);
        } else {
          setError(
            response.data.message ||
              "Unable to load salon history."
          );
        }
      } catch (err) {
        console.error(
          "Salon history error:",
          err.response?.data || err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load salon history. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [backendUrl, token, salonId]
  );

  // =====================================
  // INITIAL LOAD
  // =====================================

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // =====================================
  // STATISTICS
  // =====================================

  const counts = useMemo(() => {
    return {
      all: queues.length,

      waiting: queues.filter(
        (q) => q.status === "waiting"
      ).length,

      called: queues.filter(
        (q) => q.status === "called"
      ).length,

      "in-service": queues.filter(
        (q) => q.status === "in-service"
      ).length,

      completed: queues.filter(
        (q) => q.status === "completed"
      ).length,

      cancelled: queues.filter(
        (q) => q.status === "cancelled"
      ).length,
    };
  }, [queues]);

  // =====================================
  // SEARCH AND FILTER
  // =====================================

  const filteredQueues = useMemo(() => {
    return queues.filter((queue) => {
      const name = queue.userId?.name || "";
      const email = queue.userId?.email || "";
      const phone = queue.userId?.phone || "";
      const service = queue.serviceId?.name || "";

      const text = search.trim().toLowerCase();

      const matchesSearch =
        name.toLowerCase().includes(text) ||
        email.toLowerCase().includes(text) ||
        phone.toLowerCase().includes(text) ||
        service.toLowerCase().includes(text) ||
        String(queue.queueNumber || "").includes(text);

      const matchesStatus =
        filter === "all" || queue.status === filter;

      return matchesSearch && matchesStatus;
    });
  }, [queues, search, filter]);

  // =====================================
  // QUEUE STATUS CONFIGURATION
  // =====================================

  const statusConfig = {
    waiting: {
      label: "Waiting",
      icon: Hourglass,
      color: "text-[#e2c27e]",
      bg: "bg-[#c6a15b]/10",
      border: "border-[#c6a15b]/30",
    },

    called: {
      label: "Called",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/30",
    },

    "in-service": {
      label: "In Service",
      icon: Scissors,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-400/30",
    },

    completed: {
      label: "Completed",
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/30",
    },

    cancelled: {
      label: "Cancelled",
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-400/10",
      border: "border-red-400/30",
    },
  };

  // =====================================
  // PAYMENT INFORMATION
  // =====================================

  const getPaymentDetails = (queue) => {
    const payment =
      queue.payment ||
      (typeof queue.paymentId === "object"
        ? queue.paymentId
        : null);

    const rawStatus = (
      payment?.status ||
      queue.paymentStatus ||
      "not available"
    ).toLowerCase();

    const statusLabels = {
      paid: "Paid",
      created: "Pending",
      processing: "Processing",
      failed: "Failed",
      pending: "Pending",
      "not available": "Not Available",
    };

    const statusStyles = {
      paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      created: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
      processing: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
      failed: "bg-red-500/10 text-red-400 border-red-500/30",
      "not available": "bg-gray-500/10 text-gray-400 border-gray-500/30",
    };

    // Your Payment model stores amount in paise.
    const amount =
      payment?.amountInRupees ??
      (payment?.amount != null
        ? Number(payment.amount) / 100
        : null);

    const refundStatus = (
      payment?.refundStatus ||
      queue.refundStatus ||
      "not applicable"
    ).toLowerCase();

    const method =
      payment?.paymentMethod ||
      queue.paymentMethod ||
      "Razorpay";

    const transactionId =
      payment?.razorpayPaymentId ||
      payment?.transactionId ||
      queue.razorpayPaymentId ||
      null;

    return {
      amount,
      status: rawStatus,
      statusLabel: statusLabels[rawStatus] || rawStatus,
      statusStyle:
        statusStyles[rawStatus] ||
        statusStyles["not available"],
      refundStatus,
      method,
      transactionId,
    };
  };

  // =====================================
  // FILTER OPTIONS
  // =====================================

  const filters = [
    { label: "All Records", value: "all" },
    { label: "Waiting", value: "waiting" },
    { label: "Called", value: "called" },
    { label: "In Service", value: "in-service" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
  ];

  // =====================================
  // DATE FORMATTING
  // =====================================

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "N/A";
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================
  // TIME FORMATTING
  // =====================================

  const formatTime = (date) => {
    if (!date) return "N/A";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "N/A";
    }

    return parsed.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================
  // LOADING SCREEN
  // =====================================

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-[#090909] px-4">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c6a15b]/30 bg-[#c6a15b]/10">
            <RefreshCw
              size={28}
              className="animate-spin text-[#d5b46a]"
            />
          </div>

          <p className="mt-4 font-semibold text-white">
            Loading Salon History...
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Please wait a moment
          </p>
        </div>
      </div>
    );
  }

  // =====================================
  // MAIN UI
  // =====================================

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#090909] p-3 text-white sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-7xl">

        {/* HEADER */}

        <section className="relative mb-8 overflow-hidden rounded-3xl border border-[#c6a15b]/20 bg-[#141414] p-5 shadow-2xl shadow-black/30 sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border-[35px] border-[#c6a15b]/10" />

          <div className="pointer-events-none absolute -bottom-28 right-40 h-64 w-64 rounded-full bg-[#c6a15b]/10 blur-3xl" />

          <div className="relative z-10 flex flex-col justify-between gap-7 md:flex-row md:items-center">
            <div className="min-w-0">
              <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-[#c6a15b]/30 bg-[#c6a15b]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[2px] text-[#e2c27e]">
                <Sparkles size={14} />
                Premium Salon Management
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
                Salon Queue History
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
                Monitor customer visits, service progress,
                payment details, and your salon's complete
                booking history.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <History size={16} className="text-[#c6a15b]" />
                  Customer Records
                </span>

                <span className="h-1 w-1 rounded-full bg-gray-600" />

                <span className="flex items-center gap-2">
                  <Users size={16} className="text-[#c6a15b]" />
                  {queues.length} Total Visits
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchHistory(true)}
              disabled={refreshing}
              className="relative z-10 flex w-full items-center justify-center gap-2 rounded-xl border border-[#c6a15b]/40 bg-[#c6a15b] px-6 py-3.5 font-bold text-black shadow-lg transition hover:bg-[#e2c27e] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
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
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-400">
            <AlertCircle size={21} className="mt-0.5 shrink-0" />

            <div className="min-w-0">
              <p className="font-semibold">{error}</p>

              {!salonId && (
                <p className="mt-1 text-sm text-gray-400">
                  Check whether your admin login response
                  contains the correct salonId.
                </p>
              )}

              <button
                onClick={() => fetchHistory()}
                className="mt-3 text-sm font-semibold underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* STATISTICS */}

        <section className="mb-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">
              Overview
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Your salon's customer activity at a glance
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
            {[
              {
                label: "Total Records",
                value: counts.all,
                icon: History,
                filter: "all",
              },
              {
                label: "Waiting",
                value: counts.waiting,
                icon: Hourglass,
                filter: "waiting",
              },
              {
                label: "Called",
                value: counts.called,
                icon: Users,
                filter: "called",
              },
              {
                label: "In Service",
                value: counts["in-service"],
                icon: Scissors,
                filter: "in-service",
              },
              {
                label: "Completed",
                value: counts.completed,
                icon: CheckCircle,
                filter: "completed",
              },
              {
                label: "Cancelled",
                value: counts.cancelled,
                icon: XCircle,
                filter: "cancelled",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <button
                  type="button"
                  key={item.filter}
                  onClick={() => setFilter(item.filter)}
                  className={`min-w-0 rounded-2xl border p-3 text-left transition duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-5 ${
                    filter === item.filter
                      ? "border-[#c6a15b] bg-[#c6a15b]/10 shadow-md shadow-[#c6a15b]/5"
                      : "border-white/10 bg-[#141414] hover:border-[#c6a15b]/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#c6a15b]/20 bg-[#c6a15b]/10 sm:h-10 sm:w-10">
                      <Icon size={19} className="text-[#d5b46a]" />
                    </div>

                    <ArrowUpRight
                      size={17}
                      className="text-[#c6a15b]"
                    />
                  </div>

                  <p className="mt-4 break-words text-2xl font-bold text-white sm:mt-5">
                    {item.value}
                  </p>

                  <p className="mt-1 text-xs font-medium text-gray-400 sm:text-sm">
                    {item.label}
                  </p>

                  <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full w-1/3 rounded-full bg-[#c6a15b]" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* SEARCH AND FILTERS */}

        <section className="mb-7 rounded-2xl border border-white/10 bg-[#141414] p-4 shadow-xl sm:p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold text-white">
                Customer Records
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Search and filter your salon visits
              </p>
            </div>

            <div className="relative w-full lg:max-w-md">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c6a15b]"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer, phone, service..."
                className="w-full rounded-xl border border-white/10 bg-[#090909] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#c6a15b] focus:ring-2 focus:ring-[#c6a15b]/10"
              />
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`shrink-0 rounded-lg border px-4 py-2 text-xs font-semibold transition ${
                  filter === item.value
                    ? "border-[#c6a15b] bg-[#c6a15b] text-black"
                    : "border-white/10 bg-[#090909] text-gray-400 hover:border-[#c6a15b]/50 hover:text-[#d5b46a]"
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

        {/* RECORDS HEADING */}

        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">
              Visit Details
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Showing {filteredQueues.length} of {queues.length} records
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
            <span className="h-2 w-2 rounded-full bg-[#c6a15b]" />
            Salon History
          </div>
        </div>

        {/* EMPTY STATE */}

        {filteredQueues.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#141414] px-5 py-16 text-center shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c6a15b]/20 bg-[#c6a15b]/10">
              <History size={30} className="text-[#d5b46a]" />
            </div>

            <h3 className="mt-5 text-lg font-bold text-white">
              No Customer Records Found
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              {queues.length === 0
                ? "Your salon's customer history will appear here when customers start joining the queue."
                : "Try changing your search keyword or selecting a different status filter."}
            </p>

            {(search || filter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="mt-5 rounded-xl bg-[#c6a15b] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-[#e2c27e]"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          /* CUSTOMER HISTORY CARDS */

          <div className="space-y-4">
            {filteredQueues.map((queue) => {
              const status =
                statusConfig[queue.status] || {
                  label: "Unknown",
                  icon: AlertCircle,
                  color: "text-gray-400",
                  bg: "bg-gray-500/10",
                  border: "border-gray-500/30",
                };

              const StatusIcon = status.icon;
              const paymentInfo = getPaymentDetails(queue);

              return (
                <article
                  key={queue._id}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-lg shadow-black/20 transition duration-300 hover:border-[#c6a15b]/50 hover:shadow-xl hover:shadow-[#c6a15b]/5"
                >
                  {/* GOLD TOP BORDER */}

                  <div className="h-1 w-full bg-gradient-to-r from-[#a77c32] via-[#e2c27e] to-transparent" />

                  <div className="p-4 sm:p-6">

                    {/* CUSTOMER HEADER */}

                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-[#c6a15b]/30 bg-[#090909] shadow-sm sm:h-16 sm:w-16">
                          <img
                            src={
                              queue.userId?.profileImage ||
                              DEFAULT_PROFILE_IMAGE
                            }
                            alt={
                              queue.userId?.name || "Customer"
                            }
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src =
                                DEFAULT_PROFILE_IMAGE;
                            }}
                          />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-bold text-white">
                            {queue.userId?.name || "Unknown Customer"}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            Customer Queue #
                            {queue.queueNumber ?? "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* QUEUE STATUS */}

                      <div
                        className={`flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold ${status.bg} ${status.color} ${status.border}`}
                      >
                        <StatusIcon size={15} />
                        {status.label}
                      </div>
                    </div>

                    <div className="my-6 border-t border-dashed border-white/10" />

                    {/* CUSTOMER INFORMATION */}

                    <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
                      <Detail
                        icon={Mail}
                        label="Email Address"
                        value={queue.userId?.email || "Not available"}
                      />

                      <Detail
                        icon={Phone}
                        label="Phone Number"
                        value={queue.userId?.phone || "Not available"}
                      />

                      <Detail
                        icon={Scissors}
                        label="Service"
                        value={queue.serviceId?.name || "Unknown"}
                      />

                      <Detail
                        icon={IndianRupee}
                        label="Service Price"
                        value={
                          queue.serviceId?.price != null
                            ? `₹${queue.serviceId.price}`
                            : "Not available"
                        }
                      />

                      <Detail
                        icon={Ticket}
                        label="Queue Number"
                        value={`#${queue.queueNumber ?? "N/A"}`}
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
                        icon={MapPin}
                        label="Salon"
                        value={queue.salonId?.name || "Your Salon"}
                      />
                    </div>

                    {/* PAYMENT INFORMATION */}

                    <div className="mt-7 rounded-2xl border border-[#c6a15b]/20 bg-[#090909] p-4 sm:p-5">
                      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <h4 className="flex items-center gap-2 font-bold text-white">
                          <CreditCard
                            size={19}
                            className="text-[#d5b46a]"
                          />
                          Payment Information
                        </h4>

                        <span
                          className={`rounded-full border px-3 py-1.5 text-xs font-bold ${paymentInfo.statusStyle}`}
                        >
                          {paymentInfo.statusLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {/* AMOUNT */}

                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Payment Amount
                          </p>

                          <p className="mt-2 flex items-center gap-1 text-xl font-bold text-white">
                            <IndianRupee
                              size={18}
                              className="text-[#d5b46a]"
                            />

                            {paymentInfo.amount != null
                              ? Number(paymentInfo.amount).toLocaleString(
                                  "en-IN",
                                  {
                                    maximumFractionDigits: 2,
                                  }
                                )
                              : "Not available"}
                          </p>
                        </div>

                        {/* PAYMENT METHOD */}

                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Payment Method
                          </p>

                          <p className="mt-2 break-words text-sm font-semibold capitalize text-gray-200">
                            {paymentInfo.method}
                          </p>
                        </div>

                        {/* TRANSACTION ID */}

                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Transaction ID
                          </p>

                          <p className="mt-2 break-all text-sm font-semibold text-gray-200">
                            {paymentInfo.transactionId || "Not available"}
                          </p>
                        </div>

                        {/* REFUND STATUS */}

                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Refund Status
                          </p>

                          <p className="mt-2 flex items-center gap-2 break-words text-sm font-semibold capitalize text-gray-200">
                            <RotateCcw
                              size={15}
                              className="shrink-0 text-[#d5b46a]"
                            />

                            {paymentInfo.refundStatus.replaceAll(
                              "_",
                              " "
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* FOOTER */}

                    <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                      <span className="break-all">
                        ID: {queue._id}
                      </span>

                      <div className="flex flex-wrap items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <Clock
                            size={14}
                            className="text-[#c6a15b]"
                          />

                          {queue.serviceId?.duration != null
                            ? `${queue.serviceId.duration} min service`
                            : "Duration unavailable"}
                        </span>

                        {queue.status === "cancelled" && (
                          <span className="flex items-center gap-1.5 font-semibold text-red-400">
                            <XCircle size={14} />
                            Cancelled by customer
                          </span>
                        )}

                        {queue.status === "completed" && (
                          <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                            <CheckCircle size={14} />
                            Service completed
                          </span>
                        )}

                        {paymentInfo.status === "paid" && (
                          <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                            <CheckCircle size={14} />
                            Payment received
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* BOTTOM FOOTER */}

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-white/10 py-5 text-xs text-gray-500 sm:flex-row">
          <p>SalonPro Premium Management</p>

          <p className="flex items-center gap-2">
            <Sparkles size={13} className="text-[#c6a15b]" />
            Customer History & Service Records
          </p>
        </div>
      </div>
    </main>
  );
};

// ========================================
// REUSABLE DETAIL COMPONENT
// ========================================

const Detail = ({ icon: Icon, label, value }) => {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c6a15b]/20 bg-[#c6a15b]/10 text-[#d5b46a] transition group-hover:bg-[#c6a15b]/20">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-gray-200">
          {value}
        </p>
      </div>
    </div>
  );
};

export default SalonHistory;
