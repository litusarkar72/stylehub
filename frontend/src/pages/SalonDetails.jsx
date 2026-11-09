
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  MapPin,
  Clock,
  Phone,
  Scissors,
  Users,
  RefreshCw,
  CheckCircle2,
  Hourglass,
  CircleDot,
  Ticket,
} from "lucide-react";

import ServiceCard from "../components/ServiceCard";
import { socket } from "../socket";

const API =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const QueueStatusCard = ({ title, count, icon: Icon, color }) => (
  <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <Icon size={20} className={color} />
    </div>

    <p className={`mt-3 text-3xl font-bold ${color}`}>
      {count ?? 0}
    </p>
  </div>
);

export default function SalonDetails() {
  const [salon, setSalon] = useState(null);
  const [services, setServices] = useState([]);
  const [queueData, setQueueData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [queueLoading, setQueueLoading] = useState(false);
  const [error, setError] = useState("");
  const [queueError, setQueueError] = useState("");

  // Fetch salon and services
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [salonResponse, servicesResponse] =
          await Promise.all([
            axios.get(`${API}/api/salons/public`),
            axios.get(`${API}/api/services/public`),
          ]);

        if (cancelled) return;

        const salonData = salonResponse.data.salon;

        setSalon(salonData);
        setServices(servicesResponse.data.services || []);
      } catch (err) {
        if (!cancelled) {
          console.error(err.response?.data || err);
          setError("Unable to load salon details. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const salonId = salon?._id;

  // Fetch anonymous public queue
  const fetchPublicQueue = useCallback(async (manual = false) => {
    if (!salonId) return;

    if (manual) {
      setQueueLoading(true);
    }

    try {
      const response = await axios.get(
        `${API}/api/queue/public/${salonId}`
      );

      if (response.data?.success) {
        setQueueData(response.data);
        setQueueError("");
      }
    } catch (err) {
      console.error(
        "Public queue error:",
        err.response?.data || err
      );

      setQueueError(
        err.response?.data?.message ||
        "Unable to load live queue."
      );
    } finally {
      setQueueLoading(false);
    }
  }, [salonId]);

  // Initial fetch and automatic refresh
  useEffect(() => {
    if (!salonId) return;

    fetchPublicQueue();

    const intervalId = setInterval(() => {
      fetchPublicQueue();
    }, 15000);

    return () => clearInterval(intervalId);
  }, [salonId, fetchPublicQueue]);

  // Socket.IO live updates
  useEffect(() => {
    if (!salonId) return;

    if (!socket.connected) {
      socket.connect();
    }

    const handleQueueUpdated = () => {
      fetchPublicQueue();
    };

    socket.on("queue-updated", handleQueueUpdated);
    socket.emit("join-salon", salonId);

    return () => {
      socket.off("queue-updated", handleQueueUpdated);
      socket.emit("leave-salon", salonId);
    };
  }, [salonId, fetchPublicQueue]);

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading salon...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl p-10 text-center text-red-600">
        {error}
      </div>
    );
  }

  const summary = queueData?.queueSummary || {};

  const publicQueue = Array.isArray(queueData?.queue)
    ? queueData.queue
    : [];

  const totalActive = summary.totalActive ?? (
    (summary.waiting || 0) +
    (summary.called || 0) +
    (summary.inService || 0)
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">

      {/* Salon banner */}
      <section className="overflow-hidden rounded-2xl bg-gray-100">
        {salon?.image ? (
          <img
            src={salon.image}
            alt={salon.name}
            className="h-64 w-full object-cover sm:h-96"
          />
        ) : (
          <div className="flex h-64 items-center justify-center sm:h-96">
            <Scissors size={50} />
          </div>
        )}
      </section>

      {/* Salon information */}
      <section className="border-b py-6">
        <h1 className="text-3xl font-bold">
          {salon?.name}
        </h1>

        {salon?.description && (
          <p className="mt-2 text-gray-600">
            {salon.description}
          </p>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin size={18} className="shrink-0" />
            <span>
              {[salon?.address, salon?.city]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>

          <div className="flex items-start gap-2 text-sm text-gray-600">
            <Clock size={18} className="shrink-0" />
            <span>
              {salon?.openingTime} – {salon?.closingTime}
            </span>
          </div>

          <div className="flex items-start gap-2 text-sm text-gray-600">
            <Phone size={18} className="shrink-0" />
            <span>{salon?.phone}</span>
          </div>
        </div>
      </section>

      {/* LIVE SALON QUEUE */}
      <section className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:p-7">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Live Salon Queue
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Check how many customers are currently in the queue
              before joining.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchPublicQueue(true)}
            disabled={queueLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={queueLoading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {queueError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {queueError}
          </div>
        )}

        {/* Queue summary */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">

          <QueueStatusCard
            title="Waiting"
            count={summary.waiting}
            icon={Hourglass}
            color="text-amber-600"
          />

          <QueueStatusCard
            title="Called"
            count={summary.called}
            icon={Users}
            color="text-blue-600"
          />

          <QueueStatusCard
            title="In Service"
            count={summary.inService}
            icon={Scissors}
            color="text-purple-600"
          />

          <QueueStatusCard
            title="Completed"
            count={summary.completed}
            icon={CheckCircle2}
            color="text-green-600"
          />

          <QueueStatusCard
            title="Cancelled"
            count={summary.cancelled}
            icon={CircleDot}
            color="text-red-600"
          />

        </div>

        {/* Active customers and next number */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">

          <div className="rounded-xl bg-[#241B17] p-5 text-white">
            <div className="flex items-center gap-2 text-white/70">
              <Users size={19} />
              <span className="text-sm">
                Total active customers
              </span>
            </div>

            <p className="mt-2 text-4xl font-bold">
              {summary.totalActive ?? totalActive}
            </p>

            <p className="mt-1 text-xs text-white/60">
              Waiting + Called + In Service
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 text-gray-500">
              <Ticket size={19} />
              <span className="text-sm">
                Next queue number
              </span>
            </div>

            <p className="mt-2 text-4xl font-bold text-[#D96C50]">
              #{queueData?.nextQueueNumber ?? "—"}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Your expected number if you join now
            </p>
          </div>

        </div>

        {/* Anonymous queue list */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">

          <h3 className="text-lg font-bold text-gray-900">
            Customers Currently in Queue
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Customer names and booking details are private.
          </p>

          {publicQueue.length === 0 ? (
            <div className="py-8 text-center">
              <Users
                size={35}
                className="mx-auto text-gray-300"
              />

              <p className="mt-3 font-semibold text-gray-700">
                No active customers
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Be the first to join this salon's queue.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {publicQueue.map((item) => {
                const statusStyles = {
                  waiting:
                    "bg-amber-50 text-amber-700",
                  called:
                    "bg-blue-50 text-blue-700",
                  "in-service":
                    "bg-purple-50 text-purple-700",
                };

                const statusLabels = {
                  waiting: "Waiting",
                  called: "Called",
                  "in-service": "In Service",
                };

                return (
                  <div
                    key={item.queueNumber}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF0E5] font-bold text-[#D96C50]">
                        #{item.queueNumber}
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900">
                          Queue #{item.queueNumber}
                        </p>

                        <p className="text-xs text-gray-400">
                          Anonymous customer
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-2 text-xs font-semibold ${
                        statusStyles[item.status] ||
                        "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {statusLabels[item.status] || item.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Queue updates automatically when salon staff changes a
          customer's status.
        </p>

      </section>

      {/* Service list */}
      <section className="py-8">
        <h2 className="text-2xl font-bold">
          Our Services
        </h2>

        <p className="mt-2 text-gray-500">
          Select your preferred service to join our queue.
        </p>

        {services.length === 0 ? (
          <p className="mt-8 rounded-xl bg-gray-50 p-8 text-center text-gray-500">
            No active services available.
          </p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {services.map((service) => (
              <ServiceCard
                key={service._id}
                service={service}
              />
            ))}
          </div>
        )}
      </section>

    </main>
  );
}
