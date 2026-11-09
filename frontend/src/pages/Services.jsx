
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  Scissors,
  Sparkles,
  Star,
  Waves,
  Heart,
  RefreshCw,
} from "lucide-react";

const API =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

// Get a category without displaying a fallback category name.
function getCategory(service) {
  const category =
    service?.category ||
    service?.subCategory ||
    service?.type ||
    "";

  return typeof category === "string" ? category.trim() : "";
}

// Generate category filters without empty categories.
function getCategories(services) {
  const categories = services
    .map(getCategory)
    .filter(Boolean)
    .filter(
      (category) => category.toLowerCase() !== "other"
    );

  return ["All Services", ...new Set(categories)];
}

function getServiceImage(service) {
  if (typeof service?.image === "string") {
    return service.image;
  }

  return (
    service?.image?.url ||
    service?.imageUrl ||
    service?.photo?.url ||
    service?.photo ||
    ""
  );
}

function getDuration(service) {
  const duration =
    service.duration ??
    service.estimatedDuration ??
    service.durationMinutes;

  if (
    duration === undefined ||
    duration === null ||
    duration === ""
  ) {
    return "Duration varies";
  }

  return `${duration} min`;
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#c86b50]">
        {eyebrow}
      </p>

      <h2 className="text-3xl font-semibold tracking-tight text-[#2d211c] sm:text-4xl">
        {title}
      </h2>

      <p className="mt-4 leading-7 text-[#81756e]">
        {description}
      </p>
    </div>
  );
}

function ServiceCard({ service }) {
  const category = getCategory(service);
  const image = getServiceImage(service);

  const categoryName = category.toLowerCase();

  const Icon = categoryName.includes("spa")
    ? Waves
    : categoryName.includes("beauty")
      ? Sparkles
      : Scissors;

  const price = service.price;

  return (
    <article className="group overflow-hidden rounded-[24px] border border-[#eadfd6] bg-white transition duration-300 hover:-translate-y-2 hover:border-[#d8a18d] hover:shadow-[0_20px_50px_rgba(66,43,31,0.12)]">
      {/* Service image */}
      <div className="relative h-56 overflow-hidden bg-[#f0e6de]">
        {image ? (
          <img
            src={image}
            alt={service.name || "Salon service"}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#c86b50]">
            <Icon size={48} strokeWidth={1.3} />
          </div>
        )}

        {category && categoryName !== "other" && (
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#a8513b] shadow-sm">
            {category}
          </span>
        )}

        <span className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#c86b50] shadow-md transition group-hover:bg-[#c86b50] group-hover:text-white">
          <Icon size={19} />
        </span>
      </div>

      {/* Service details */}
      <div className="p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          {category && categoryName !== "other" ? (
            <span className="rounded-full bg-[#fbf3ed] px-3 py-1 text-xs font-medium text-[#a85d46]">
              {category}
            </span>
          ) : (
            <span />
          )}

          <span className="flex items-center gap-1 text-xs text-[#897b72]">
            <Clock size={13} />
            {getDuration(service)}
          </span>
        </div>

        <h3 className="text-xl font-semibold text-[#30221c] transition group-hover:text-[#b75b42]">
          {service.name || "Salon Service"}
        </h3>

        <p className="mt-2 min-h-[48px] text-sm leading-6 text-[#82766f]">
          {service.description || "Discover this salon service."}
        </p>

        <div className="my-5 border-t border-[#f0e7e0]" />

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#978981]">
              Service price
            </p>

            <p className="mt-1 text-2xl font-bold text-[#2e211b]">
              {price !== undefined &&
              price !== null &&
              price !== ""
                ? `₹${price}`
                : "Price unavailable"}
            </p>
          </div>

          {service._id ? (
            <Link
              to={`/join-queue/${service._id}`}
              className="stylehub-button inline-flex items-center gap-2 rounded-full bg-[#c86b50] px-4 py-3 text-sm font-semibold text-white hover:bg-[#ad523b]"
            >
              Book now
              <ArrowUpRight size={16} />
            </Link>
          ) : (
            <span className="rounded-full bg-gray-100 px-4 py-3 text-xs text-gray-500">
              Unavailable
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function LoadingCards() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-[24px] border border-[#eadfd6] bg-white"
        >
          <div className="h-56 animate-pulse bg-[#eee4dc]" />
          <div className="space-y-4 p-6">
            <div className="h-4 w-1/3 animate-pulse rounded bg-[#eee4dc]" />
            <div className="h-6 w-2/3 animate-pulse rounded bg-[#eee4dc]" />
            <div className="h-4 w-full animate-pulse rounded bg-[#eee4dc]" />
            <div className="h-10 w-full animate-pulse rounded bg-[#eee4dc]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Services() {
  const [services, setServices] = useState([]);
  const [activeCategory, setActiveCategory] =
    useState("All Services");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchServices() {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${API}/api/services/public`
      );

      const data = response.data;

      // Support common API response structures.
      const serviceList =
        data.services ??
        data.data?.services ??
        (Array.isArray(data.data) ? data.data : null) ??
        (Array.isArray(data) ? data : []);

      if (!Array.isArray(serviceList)) {
        throw new Error(
          "The services API did not return a list of services."
        );
      }

      setServices(serviceList);
    } catch (err) {
      console.error(
        "Unable to fetch services:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load services. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchServices();
  }, []);

  const categories = useMemo(
    () => getCategories(services),
    [services]
  );

  // Keep uncategorized services visible.
  const filteredServices = useMemo(() => {
    if (activeCategory === "All Services") {
      return services;
    }

    return services.filter(
      (service) => getCategory(service) === activeCategory
    );
  }, [services, activeCategory]);

  return (
    <main className="stylehub-glow min-h-screen pb-16">
      {/* Hero banner */}
      <section
        id="services-hero"
        className="px-4 pb-12 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-10 overflow-hidden rounded-[30px] border border-[#eddfd3] bg-[#f3e7dc] p-6 sm:p-10 lg:grid-cols-2 lg:p-14">
          <div className="stylehub-enter">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e5c9b8] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#a85b43]">
              <Sparkles size={15} />
              Your self-care starts here
            </div>

            <h1 className="max-w-xl text-4xl font-semibold leading-[1.12] tracking-tight text-[#2e211b] sm:text-5xl lg:text-6xl">
              A little care.
              <span className="block font-serif italic font-normal text-[#c86b50]">
                A lot of confidence.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-[#796b62]">
              Discover the services your salon offers. Find a
              treatment you love and take time for yourself.
            </p>

            <a
              href="#all-services"
              className="stylehub-button mt-7 inline-flex items-center gap-3 rounded-full bg-[#c86b50] px-6 py-3.5 font-semibold text-white hover:bg-[#ad523b]"
            >
              Explore our services
              <ArrowRight size={18} />
            </a>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-[#695b52]">
              <span className="flex items-center gap-2">
                <Check size={16} className="text-[#b75b42]" />
                Dynamic service listings
              </span>

              <span className="flex items-center gap-2">
                <Check size={16} className="text-[#b75b42]" />
                Easy queue booking
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-3 rotate-3 rounded-[28px] bg-[#dfbba5]/60" />

            <div className="relative h-[320px] overflow-hidden rounded-[24px] shadow-xl sm:h-[420px]">
              <img
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=90"
                alt="Salon interior"
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/40 bg-white/90 p-4 backdrop-blur-md sm:inset-x-5 sm:bottom-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5e3d7] text-[#b75b42]">
                    <Star size={20} fill="currentColor" />
                  </div>

                  <div>
                    <p className="font-semibold text-[#30221c]">
                      Your moment to shine
                    </p>
                    <p className="mt-1 text-xs text-[#82766f]">
                      Beauty, comfort and confidence
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic services */}
      <section
        id="all-services"
        className="scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="The StyleHub collection"
            title="Find your perfect treatment"
            description="Browse the services currently available from your salon."
          />

          {loading ? (
            <LoadingCards />
          ) : error ? (
            <div className="rounded-[24px] border border-[#eadfd6] bg-white p-8 text-center">
              <p className="font-semibold text-[#30221c]">
                We couldn't load the services
              </p>

              <p className="mt-2 text-sm text-[#81756e]">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchServices}
                className="stylehub-button mt-5 inline-flex items-center gap-2 rounded-full bg-[#c86b50] px-5 py-3 font-semibold text-white hover:bg-[#ad523b]"
              >
                <RefreshCw size={16} />
                Try again
              </button>
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-[24px] border border-[#eadfd6] bg-white px-6 py-12 text-center">
              <Scissors
                size={36}
                className="mx-auto text-[#c86b50]"
              />

              <h3 className="mt-4 text-xl font-semibold text-[#30221c]">
                No services available yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#81756e]">
                Services will appear here once they are added to
                the database and returned by the public services API.
              </p>
            </div>
          ) : (
            <>
              {/* Dynamic category filters */}
              <div className="mb-9 flex flex-wrap justify-center gap-3">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-full border px-5 py-3 text-sm font-semibold transition duration-200 ${
                      activeCategory === category
                        ? "border-[#c86b50] bg-[#c86b50] text-white shadow-md"
                        : "border-[#e8dcd2] bg-white text-[#6e6058] hover:border-[#c86b50] hover:text-[#b75b42]"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <p className="mb-5 text-sm text-[#81756e]">
                Showing {filteredServices.length}{" "}
                {filteredServices.length === 1
                  ? "service"
                  : "services"}
              </p>

              {filteredServices.length === 0 ? (
                <p className="py-10 text-center text-[#81756e]">
                  No services found in this category.
                </p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredServices.map((service) => (
                    <ServiceCard
                      key={service._id}
                      service={service}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[28px] bg-[#30241e] px-6 py-10 text-white sm:px-10 sm:py-14">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: "Care made personal",
                text: "Choose from the services available at your salon.",
              },
              {
                icon: Clock,
                title: "Less waiting, more living",
                text: "Use queue booking to organize your visit.",
              },
              {
                icon: Heart,
                title: "Your time to unwind",
                text: "Make space in your day for a little self-care.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#efb49c]">
                    <Icon size={23} />
                  </div>

                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/65">
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-10 text-center sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#c86b50]">
          You deserve this
        </p>

        <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold text-[#30221c] sm:text-4xl">
          Ready to make time for yourself?
        </h2>

        <p className="mx-auto mt-4 max-w-xl leading-7 text-[#81756e]">
          Choose an available service and continue to booking.
        </p>

       <a
  href="#all-services"
  className="stylehub-button mt-6 inline-flex items-center gap-2 rounded-full bg-[#c86b50] px-7 py-4 font-semibold text-white hover:bg-[#ad523b]"
>
  Get Started
  <ArrowRight size={18} />
</a>
      </section>
    </main>
  );
}
