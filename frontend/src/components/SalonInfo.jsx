
import { useEffect, useState } from "react";
import axios from "axios";
import {
  MapPin,
  Clock,
  Phone,
  Scissors,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

const API =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=85";

export default function SalonInfo() {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchSalons() {
      try {
        const response = await axios.get(
          `${API}/api/salons/public`
        );

        if (cancelled) return;

        const data = response.data;

        // Handle common API response formats.
        const result = Array.isArray(data)
          ? data
          : Array.isArray(data.salons)
            ? data.salons
            : Array.isArray(data.data?.salons)
              ? data.data.salons
              : data.salon
                ? [data.salon]
                : data.data?.salon
                  ? [data.data.salon]
                  : [];

        setSalons(result);
      } catch (err) {
        console.error(
          "Failed to load salons:",
          err.response?.data || err.message
        );

        if (!cancelled) {
          setError("We couldn't load the salon details.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSalons();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="h-64 rounded-2xl bg-[#F2E8DF]" />
        <div className="h-7 w-3/4 rounded bg-[#F2E8DF]" />
        <div className="h-4 w-full rounded bg-[#F2E8DF]" />
        <div className="h-4 w-2/3 rounded bg-[#F2E8DF]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-[#FFF4EF] p-6 text-center">
        <Scissors
          size={32}
          className="mx-auto text-[#C86B50]"
        />
        <p className="mt-3 font-semibold text-[#30221C]">
          Salon details unavailable
        </p>
        <p className="mt-2 text-sm text-[#81756E]">
          Please try again in a moment.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl bg-[#C86B50] px-5 py-3 text-sm font-semibold text-white hover:bg-[#AD523B]"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (salons.length === 0) {
    return (
      <div className="rounded-2xl border border-[#EADFD6] bg-white p-8 text-center">
        <Scissors
          size={36}
          className="mx-auto text-[#C86B50]"
        />
        <h2 className="mt-4 text-xl font-bold text-[#30221C]">
          Your salon is coming soon
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#81756E]">
          Salon information will appear here when it becomes
          available.
        </p>
      </div>
    );
  }

  // Show the first salon in the hero.
  const salon = salons[0];

  const image =
    typeof salon.image === "string"
      ? salon.image
      : salon.image?.url ||
        salon.imageUrl ||
        salon.coverImage ||
        FALLBACK_IMAGE;

  const address = [salon.address, salon.city]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="w-full min-w-0">
      {/* Salon image */}
      <div className="group relative h-60 overflow-hidden rounded-2xl sm:h-72">
        <img
          src={image}
          alt={salon.name || "Salon interior"}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold text-[#9A6047] shadow-sm">
          <Sparkles size={14} className="text-[#C86B50]" />
          Featured Salon
        </div>

        <div className="absolute bottom-5 left-5 right-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">
            MEET YOUR SALON
          </p>

          <h2 className="mt-2 break-words text-2xl font-bold sm:text-3xl">
            {salon.name || "Discover Our Salon"}
          </h2>

          {address && (
            <p className="mt-2 flex items-start gap-2 text-sm text-white/90">
              <MapPin
                size={16}
                className="mt-0.5 shrink-0"
              />
              <span>{address}</span>
            </p>
          )}
        </div>
      </div>

      {/* Salon details */}
      <div className="pt-6">
        {salon.description && (
          <p className="text-sm leading-7 text-[#81756E]">
            {salon.description}
          </p>
        )}

        <div className="mt-5 divide-y divide-[#F0E6DE] rounded-2xl border border-[#F0E6DE] bg-white">
          {(salon.openingTime || salon.closingTime) && (
            <div className="flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0E5] text-[#C86B50]">
                <Clock size={19} />
              </div>

              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-semibold text-[#30221C]">
                  Opening Hours
                </p>
                <p className="mt-1 text-sm text-[#81756E]">
                  {salon.openingTime || "Not specified"}
                  {" – "}
                  {salon.closingTime || "Not specified"}
                </p>
              </div>
            </div>
          )}

          {salon.phone && (
            <div className="flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0E5] text-[#C86B50]">
                <Phone size={19} />
              </div>

              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-semibold text-[#30221C]">
                  Contact Number
                </p>
                <a
                  href={`tel:${salon.phone}`}
                  className="mt-1 block break-all text-sm text-[#81756E] transition hover:text-[#C86B50]"
                >
                  {salon.phone}
                </a>
              </div>
            </div>
          )}

          {address && (
            <div className="flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0E5] text-[#C86B50]">
                <MapPin size={19} />
              </div>

              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-semibold text-[#30221C]">
                  Location
                </p>
                <p className="mt-1 break-words text-sm leading-6 text-[#81756E]">
                  {address}
                </p>
              </div>
            </div>
          )}
        </div>

        <Link
          to={`/salon/${salon._id}`}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#C86B50] px-5 py-4 text-sm font-bold text-white shadow-md shadow-[#C86B50]/15 transition hover:-translate-y-0.5 hover:bg-[#AD523B]"
        >
          View Salon Details
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
