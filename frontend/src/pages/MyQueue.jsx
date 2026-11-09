
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { socket } from "../socket";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  CircleCheck,
  Clock,
  Home,
  History,
  MapPin,
  RefreshCw,
  Scissors,
  Users,
  AlertCircle,
  Ticket,
  Phone,
  XCircle,
} from "lucide-react";

import { useAppContext } from "../context/AppContext";

const API =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const ACTIVE_STATUSES = ["waiting", "called", "in-service"];

// ========================================
// HELPER FUNCTIONS
// ========================================

const formatDuration = (minutes = 0) => {
  const value = Math.max(0, Number(minutes) || 0);

  if (value === 0) return "0 minutes";
  if (value < 60) return `${value} minutes`;

  const hours = Math.floor(value / 60);
  const remaining = value % 60;

  if (remaining === 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `${hours} hr ${remaining} min`;
};

const formatStatus = (status = "waiting") => {
  const labels = {
    waiting: "In Queue",
    called: "Up Next",
    "in-service": "In Service",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return labels[status] || status;
};

const getStatusStyle = (status) => {
  const styles = {
    waiting: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    called: "bg-amber-50 text-amber-700 ring-amber-100",
    "in-service": "bg-blue-50 text-blue-700 ring-blue-100",
    completed: "bg-green-50 text-green-700 ring-green-100",
    cancelled: "bg-red-50 text-red-700 ring-red-100",
  };

  return styles[status] || "bg-gray-100 text-gray-700 ring-gray-200";
};

const getProgressIndex = (status) => {
  const steps = {
    waiting: 0,
    called: 1,
    "in-service": 2,
    completed: 3,
  };

  return steps[status] ?? -1;
};

const getImageUrl = (service) => {
  if (!service) return "";

  const image = service.image || service.imageUrl;

  if (typeof image === "string") return image;
  if (Array.isArray(image)) return image[0] || "";

  return "";
};

// ========================================
// QUEUE PROGRESS COMPONENT
// ========================================

function QueueProgress({ status }) {
  const steps = ["In Queue", "Up Next", "Your Turn", "Completed"];
  const activeIndex = getProgressIndex(status);

  if (status === "cancelled") {
    return (
      <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
        This queue entry has been cancelled. Please contact the salon
        if you need assistance.
      </div>
    );
  }

  return (
    <div className="mt-7">
      <div className="grid grid-cols-4">
        {steps.map((step, index) => {
          const completed = activeIndex >= 0 && index < activeIndex;
          const current = index === activeIndex;
          const reached = activeIndex >= 0 && index <= activeIndex;

          return (
            <div
              key={step}
              className="relative flex flex-col items-center"
            >
              {index > 0 && (
                <div
                  className={`absolute right-1/2 top-4 h-1 w-full ${
                    reached ? "bg-[#D96C50]" : "bg-gray-200"
                  }`}
                />
              )}

              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  completed
                    ? "border-[#D96C50] bg-[#D96C50] text-white"
                    : current
                    ? "border-[#D96C50] bg-white text-[#D96C50] ring-4 ring-orange-100"
                    : "border-gray-200 bg-white text-gray-300"
                }`}
              >
                {completed ? (
                  <CheckCircle2 size={18} />
                ) : current ? (
                  <CircleCheck size={18} />
                ) : (
                  <Circle size={15} />
                )}
              </div>

              <span
                className={`mt-3 text-center text-[10px] font-medium sm:text-xs ${
                  reached ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ========================================
// LOADING SCREEN
// ========================================

function LoadingScreen() {
  return (
    <main className="stylehub-glow flex min-h-[70vh] items-center justify-center px-4">
      <div className="text-center">
        <RefreshCw
          size={34}
          className="mx-auto animate-spin text-[#D96C50]"
        />

        <p className="mt-4 text-sm text-gray-600">
          Loading your queue...
        </p>
      </div>
    </main>
  );
}

// ========================================
// MESSAGE SCREEN
// ========================================

function MessageScreen({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  loading = false,
  error = false,
}) {
  return (
    <main className="stylehub-glow flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="stylehub-card stylehub-enter w-full max-w-md p-8 text-center">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
            error
              ? "bg-red-50 text-red-500"
              : "bg-[#FFF0E5] text-[#D96C50]"
          }`}
        >
          <Icon size={32} />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-gray-950">
          {title}
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          {description}
        </p>

        {onAction ? (
          <button
            type="button"
            onClick={onAction}
            disabled={loading}
            className="stylehub-button mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#241B17] px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Please wait..." : actionLabel}
          </button>
        ) : (
          <Link
            to={action || "/services"}
            className="stylehub-button mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#241B17] px-6 py-3 font-semibold text-white"
          >
            {actionLabel}
            <ArrowRight size={17} />
          </Link>
        )}

        {error && (
          <Link
            to="/services"
            className="mt-5 block text-sm text-gray-500 underline"
          >
            Browse services
          </Link>
        )}
      </div>
    </main>
  );
}

// ========================================
// MAIN MY QUEUE COMPONENT
// ========================================

export default function MyQueue() {
  const { queueId } = useParams();
  const { token, isAuthenticated } = useAppContext();

  const [queue, setQueue] = useState(null);
  const [peopleAhead, setPeopleAhead] = useState(0);
  const [queueSummary, setQueueSummary] = useState(null);
  const [estimatedWait, setEstimatedWait] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // ========================================
  // FETCH CUSTOMER QUEUE
  // ========================================

  const fetchQueue = useCallback(
    async (isManualRefresh = false) => {
      if (!isAuthenticated || !token) {
        setQueue(null);
        setError("Please log in to view your queue.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const endpoint = queueId
          ? `${API}/api/queue/my/${queueId}`
          : `${API}/api/queue/my-active`;

        const response = await axios.get(endpoint, {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data?.success === false) {
          throw new Error(
            response.data.message || "Unable to load your queue."
          );
        }

        const data = response.data;
        const queueData = data.queue || null;

        setQueue(queueData);
        setPeopleAhead(Number(data.peopleAhead) || 0);
        setEstimatedWait(Number(data.estimatedWait) || 0);

        // Fetch salon-wide queue counts
        if (queueData?._id) {
          try {
            const positionResponse = await axios.get(
              `${API}/api/queue/my-position/${queueData._id}`,
              {
                withCredentials: true,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            const summary =
              positionResponse.data?.queueSummary || null;

            setQueueSummary(summary);

            setPeopleAhead(
              Number(summary?.peopleAhead) || 0
            );
          } catch (positionError) {
            console.error(
              "Queue summary error:",
              positionError.response?.data || positionError
            );

            setQueueSummary(null);
          }
        } else {
          setQueueSummary(null);
          setPeopleAhead(0);
        }

        setLastUpdated(new Date());

        if (!queueData && !queueId) {
          setPeopleAhead(0);
          setEstimatedWait(0);
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load your queue. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [queueId, token, isAuthenticated]
  );

  // ========================================
  // AUTOMATIC QUEUE REFRESH
  // ========================================

  useEffect(() => {
    fetchQueue();

    const intervalId = setInterval(() => {
      fetchQueue();
    }, 15000);

    return () => clearInterval(intervalId);
  }, [fetchQueue]);

  // ========================================
  // CANCEL CUSTOMER QUEUE
  // ========================================

  const handleCancelQueue = async () => {
    if (!queue?._id || cancelling) return;

    if (!["waiting", "called"].includes(queue.status)) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to leave this queue?"
    );

    if (!confirmed) return;

    try {
      setCancelling(true);
      setError("");

      const response = await axios.patch(
        `${API}/api/queue/cancel/${queue._id}`,
        {},
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        // Update customer queue immediately
        setQueue((previousQueue) => ({
          ...previousQueue,
          status: "cancelled",
        }));

        setPeopleAhead(0);
        setEstimatedWait(0);

        // Refresh queue and salon statistics
        await fetchQueue(true);
      } else {
        throw new Error(
          response.data?.message || "Unable to cancel queue."
        );
      }
    } catch (err) {
      console.error(
        "Cancel queue error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to cancel your queue."
      );
    } finally {
      setCancelling(false);
    }
  };

  // ========================================
  // SALON ID
  // ========================================

  const salonId =
    typeof queue?.salonId === "object"
      ? queue?.salonId?._id
      : queue?.salonId;

  // ========================================
  // SOCKET.IO REAL-TIME UPDATES
  // ========================================

  useEffect(() => {
    if (!salonId) return;

    if (!socket.connected) {
      socket.connect();
    }

    const handleQueueUpdated = () => {
      fetchQueue();
    };

    socket.on("queue-updated", handleQueueUpdated);
    socket.emit("join-salon", salonId);

    return () => {
      socket.off("queue-updated", handleQueueUpdated);
      socket.emit("leave-salon", salonId);
    };
  }, [salonId, fetchQueue]);

  // ========================================
  // QUEUE DETAILS
  // ========================================

  const salon =
    queue?.salonId && typeof queue.salonId === "object"
      ? queue.salonId
      : null;

  const service =
    queue?.serviceId && typeof queue.serviceId === "object"
      ? queue.serviceId
      : null;

  const status = queue?.status || "waiting";

  const isActive = ACTIVE_STATUSES.includes(status);

  const queueNumber = queue?.queueNumber ?? "—";

  const serviceImage = getImageUrl(service);

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return <LoadingScreen />;
  }

  // ========================================
  // LOGIN REQUIRED
  // ========================================

  if (!isAuthenticated || !token) {
    return (
      <MessageScreen
        icon={AlertCircle}
        title="Login required"
        description="Please log in to view and track your salon queue."
        action="/login"
        actionLabel="Log in"
      />
    );
  }

  // ========================================
  // ERROR
  // ========================================

  if (error && !queue) {
    return (
      <MessageScreen
        icon={AlertCircle}
        title="Unable to load queue"
        description={error}
        actionLabel="Try again"
        onAction={() => fetchQueue(true)}
        loading={refreshing}
        error
      />
    );
  }

  // ========================================
  // NO ACTIVE QUEUE
  // ========================================

  if (!queue) {
    return (
      <MessageScreen
        icon={Ticket}
        title="You're not in a queue yet"
        description="Choose a salon service and join the queue to track your turn here."
        action="/services"
        actionLabel="Explore services"
      />
    );
  }

  // ========================================
  // QUEUE DATE
  // ========================================

  const queueDate = queue.queueDate
    ? new Date(queue.queueDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Today's queue";

  // ========================================
  // MAIN UI
  // ========================================

  return (
    <main className="stylehub-glow min-h-screen px-4 py-7 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">

        {/* HEADING */}

        <div className="stylehub-enter flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-[#D96C50]"
            >
              <ArrowLeft size={17} />
              Back to home
            </Link>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              My Queue
            </h1>

            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              Your salon visit, made simple. Track your turn live.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchQueue(true)}
            disabled={refreshing || cancelling}
            className="stylehub-button inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* ERROR MESSAGE */}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* SELECTED SERVICE */}

        <section className="stylehub-card stylehub-enter mt-7 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

            {serviceImage ? (
              <img
                src={serviceImage}
                alt={service?.name || "Selected salon service"}
                className="h-40 w-full rounded-xl object-cover sm:h-24 sm:w-28"
              />
            ) : (
              <div className="flex h-32 w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#F9E8DA] to-[#F2D1B8] sm:h-24 sm:w-28">
                <Scissors size={35} className="text-[#9B6045]" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                Your selected service
              </p>

              <h2 className="mt-2 text-xl font-bold text-gray-950">
                {service?.name || "Salon service"}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {service?.price != null && (
                  <span className="font-bold text-gray-900">
                    ₹{service.price}
                  </span>
                )}

                {service?.duration != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={15} />
                    {formatDuration(service.duration)}
                  </span>
                )}
              </div>
            </div>

            <span
              className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(status)}`}
            >
              <span className="mr-2 h-2 w-2 rounded-full bg-current" />
              {formatStatus(status)}
            </span>
          </div>
        </section>

        {/* QUEUE TICKET */}

        <section className="stylehub-card stylehub-enter stylehub-delay-1 mt-5 overflow-hidden">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#241B17] via-[#38271F] to-[#624331] px-5 py-7 text-white sm:px-8 sm:py-9">

            <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-2 -top-6 h-36 w-36 rounded-full border border-white/10" />

            <div className="relative flex flex-wrap items-center justify-between gap-5">
              <div>
                <p className="text-sm text-white/65">
                  YOUR QUEUE NUMBER
                </p>

                <p className="mt-2 text-6xl font-extrabold tracking-tight sm:text-7xl">
                  #{queueNumber}
                </p>

                <p className="mt-4 max-w-md text-sm leading-6 text-white/75">
                  {status === "waiting" &&
                    "You're in line. We'll keep your queue details updated."}

                  {status === "called" &&
                    "You're up next. Please check in with salon staff."}

                  {status === "in-service" &&
                    "Your salon service is currently in progress."}

                  {status === "completed" &&
                    "Your service is complete. Thank you for visiting!"}

                  {status === "cancelled" &&
                    "This queue entry has been cancelled."}
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 text-center backdrop-blur-sm">
                <Ticket
                  size={27}
                  className="mx-auto text-[#F4C6A4]"
                />

                <p className="mt-3 text-xs text-white/60">
                  Queue ticket
                </p>

                <p className="mt-1 text-lg font-bold">
                  #{queueNumber}
                </p>
              </div>
            </div>
          </div>

          {/* QUEUE STATISTICS */}

          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:p-5">

            {/* POSITION */}

            <div className="stylehub-card p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="rounded-lg bg-orange-100 p-2 text-[#D96C50]">
                  <Users size={18} />
                </div>
                Your Position
              </div>

              <p className="mt-4 text-3xl font-bold text-gray-950">
                {isActive ? peopleAhead + 1 : "—"}

                {isActive && (
                  <span className="ml-1 text-xs font-medium text-gray-400">
                    in line
                  </span>
                )}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {isActive
                  ? `${peopleAhead} ${peopleAhead === 1 ? "person" : "people"} ahead`
                  : "Queue is not active"}
              </p>
            </div>

            {/* WAITING TIME */}

            <div className="stylehub-card p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="rounded-lg bg-green-100 p-2 text-green-700">
                  <Clock size={18} />
                </div>

                Estimated Wait
              </div>

              <p className="mt-4 text-2xl font-bold text-green-700 sm:text-3xl">
                {isActive ? formatDuration(estimatedWait) : "—"}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Estimated time before your service
              </p>
            </div>

            {/* STATUS */}

            <div className="stylehub-card p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                  <CheckCircle2 size={18} />
                </div>

                Current Status
              </div>

              <p className="mt-4 text-xl font-bold text-gray-950">
                {formatStatus(status)}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Queue status
              </p>
            </div>
          </div>
        </section>

        {/* LIVE SALON QUEUE SUMMARY */}

        <section className="stylehub-card mt-5 p-5 sm:p-7">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-950">
              Live Salon Queue
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Overall queue progress for this salon. Other customers'
              personal details remain private.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              {
                label: "Waiting",
                value: queueSummary?.waiting,
                color: "text-amber-700",
                bg: "bg-amber-50",
              },
              {
                label: "Called",
                value: queueSummary?.called,
                color: "text-blue-700",
                bg: "bg-blue-50",
              },
              {
                label: "In Service",
                value: queueSummary?.inService,
                color: "text-purple-700",
                bg: "bg-purple-50",
              },
              {
                label: "Completed",
                value: queueSummary?.completed,
                color: "text-green-700",
                bg: "bg-green-50",
              },
              {
                label: "Cancelled",
                value: queueSummary?.cancelled,
                color: "text-red-700",
                bg: "bg-red-50",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-xl p-4 ${item.bg}`}
              >
                <p className="text-xs font-medium text-gray-500">
                  {item.label}
                </p>

                <p className={`mt-2 text-3xl font-bold ${item.color}`}>
                  {item.value ?? "—"}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* QUEUE PROGRESS */}

        <section className="stylehub-card stylehub-enter stylehub-delay-2 mt-5 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-950">
                Your queue progress
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Every step brings you closer to your service.
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(status)}`}
            >
              {formatStatus(status)}
            </span>
          </div>

          <QueueProgress status={status} />

          {lastUpdated && (
            <p className="mt-6 border-t border-gray-100 pt-4 text-xs text-gray-400">
              <RefreshCw size={12} className="mr-1 inline" />

              Last updated at{" "}

              {lastUpdated.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}

              {" · "}Refreshes every 15 seconds
            </p>
          )}
        </section>

        {/* SALON AND SERVICE DETAILS */}

        <div className="mt-5 grid gap-5 md:grid-cols-2">

          {/* SALON DETAILS */}

          <section className="stylehub-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#FFF0E5] p-3 text-[#C66A46]">
                <MapPin size={21} />
              </div>

              <div>
                <h2 className="font-bold text-gray-950">
                  Salon details
                </h2>

                <p className="text-xs text-gray-500">
                  Your selected salon
                </p>
              </div>
            </div>

            <h3 className="mt-5 text-lg font-bold text-gray-900">
              {salon?.name || "StyleHub Salon"}
            </h3>

            <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-gray-500">
              <MapPin size={16} className="mt-1 shrink-0" />

              {[salon?.address, salon?.city]
                .filter(Boolean)
                .join(", ") || "Salon address unavailable"}
            </p>

            {salon?.phone && (
              <a
                href={`tel:${salon.phone}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#C66A46] hover:underline"
              >
                <Phone size={15} />
                {salon.phone}
              </a>
            )}
          </section>

          {/* SERVICE DETAILS */}

          <section className="stylehub-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#FFF0E5] p-3 text-[#C66A46]">
                <Scissors size={21} />
              </div>

              <div>
                <h2 className="font-bold text-gray-950">
                  Service information
                </h2>

                <p className="text-xs text-gray-500">
                  Your booking details
                </p>
              </div>
            </div>

            <div className="mt-5 divide-y divide-gray-100">

              <div className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="text-gray-500">Service</span>

                <span className="text-right font-semibold text-gray-900">
                  {service?.name || "Salon service"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="text-gray-500">Duration</span>

                <span className="font-semibold text-gray-900">
                  {service?.duration != null
                    ? formatDuration(service.duration)
                    : "Not available"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="text-gray-500">Price</span>

                <span className="font-semibold text-gray-900">
                  {service?.price != null
                    ? `₹${service.price}`
                    : "Not available"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="text-gray-500">Queue date</span>

                <span className="text-right font-semibold text-gray-900">
                  {queueDate}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* ACTIONS */}

        <div className="stylehub-enter stylehub-delay-3 mt-6 grid gap-3 sm:grid-cols-2">

          {/* BROWSE SERVICES */}

          <Link
            to="/services"
            className="stylehub-button inline-flex items-center justify-center gap-2 rounded-xl bg-[#241B17] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[#463027]"
          >
            <Scissors size={17} />
            Browse services
            <ArrowRight size={16} />
          </Link>

          {/* QUEUE HISTORY */}

          <Link
            to="/queue-history"
            className="stylehub-button inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <History size={17} />
            View queue history
          </Link>

          {/* CUSTOMER LEAVE QUEUE */}

          {["waiting", "called"].includes(status) && (
            <button
              type="button"
              onClick={handleCancelQueue}
              disabled={cancelling}
              className="stylehub-button inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelling ? (
                <RefreshCw size={17} className="animate-spin" />
              ) : (
                <XCircle size={17} />
              )}

              {cancelling ? "Leaving Queue..." : "Leave Queue"}
            </button>
          )}

          {/* BACK HOME */}

          <Link
            to="/"
            className="stylehub-button inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:col-span-2"
          >
            <Home size={17} />
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
