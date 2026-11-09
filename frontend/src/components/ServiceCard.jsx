
import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";

export function formatDuration(minutes) {
  const value = Number(minutes);

  if (!Number.isFinite(value) || value <= 0) {
    return "Duration unavailable";
  }

  const hours = Math.floor(value / 60);
  const remaining = value % 60;

  if (!hours) return `${remaining} minutes`;
  if (!remaining) return `${hours} ${hours === 1 ? "hour" : "hours"}`;

  return `${hours} ${hours === 1 ? "hour" : "hours"} ${remaining} minutes`;
}

export default function ServiceCard({ service }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      {service.image ? (
        <img
          src={service.image}
          alt={service.name}
          loading="lazy"
          className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="flex h-48 items-center justify-center bg-gray-100 text-sm text-gray-500">
          No service image
        </div>
      )}

      <div className="p-4">
        <h3 className="text-lg font-semibold">{service.name}</h3>

        {service.description && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
            {service.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-lg font-bold">
            ₹{Number(service.price).toLocaleString("en-IN")}
          </span>

          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Clock size={14} />
            {formatDuration(service.duration)}
          </span>
        </div>

        <Link
          to={`/join-queue/${service._id}`}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Join Queue
          <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}
