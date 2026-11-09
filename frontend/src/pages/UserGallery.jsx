
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Expand,
  Image as ImageIcon,
  X,
} from "lucide-react";

const API =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const CATEGORIES = [
  "All",
  "Haircut",
  "Beard Grooming",
  "Hair Treatment",
  "Salon Interior",
  "Transformations",
];

export default function UserGallery({ salonId }) {
  const [images, setImages] = useState([]);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  const fetchGallery = useCallback(async () => {
    if (!salonId) {
      setImages([]);
      setLoading(false);
      setError("Salon information is not available.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${API}/api/gallery/salon/${salonId}`
      );

      setImages(response.data.images || []);
    } catch (err) {
      console.error(
        "Gallery fetch failed:",
        err.response?.data || err
      );

      setImages([]);
      setError(
        err.response?.data?.message ||
          "We couldn't load the gallery. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [salonId]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const filteredImages = useMemo(() => {
    if (category === "All") return images;

    return images.filter(
      (image) => image.category === category
    );
  }, [images, category]);

  const activeIndex = filteredImages.findIndex(
    (image) => image._id === activeImage?._id
  );

  const showPrevious = () => {
    if (activeIndex < 0 || filteredImages.length < 2) return;

    const previousIndex =
      (activeIndex - 1 + filteredImages.length) %
      filteredImages.length;

    setActiveImage(filteredImages[previousIndex]);
  };

  const showNext = () => {
    if (activeIndex < 0 || filteredImages.length < 2) return;

    const nextIndex =
      (activeIndex + 1) % filteredImages.length;

    setActiveImage(filteredImages[nextIndex]);
  };

  useEffect(() => {
    if (!activeImage) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setActiveImage(null);
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeImage, activeIndex, filteredImages]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#faf9f6] text-[#20201e]">
      {/* Hero */}
      <section className="relative isolate flex min-h-[420px] items-center justify-center overflow-hidden bg-[#171714] px-5 py-20 text-center text-white sm:min-h-[500px]">
        <div
          className="absolute inset-0 -z-10 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #c7a66a 0, transparent 35%), radial-gradient(circle at 80% 80%, #8e7040 0, transparent 35%)",
          }}
        />

        <div className="absolute left-5 top-5 h-20 w-20 border-l border-t border-[#c7a66a]/50 sm:left-10 sm:top-10 sm:h-28 sm:w-28" />
        <div className="absolute bottom-5 right-5 h-20 w-20 border-b border-r border-[#c7a66a]/50 sm:bottom-10 sm:right-10 sm:h-28 sm:w-28" />

        <div className="mx-auto max-w-3xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.4em] text-[#d4b578] sm:text-sm">
            Style • Elegance • Confidence
          </p>

          <h1 className="text-4xl font-light leading-tight sm:text-6xl lg:text-7xl">
            The Art of
            <span className="mt-2 block font-serif italic text-[#d4b578]">
              Looking Your Best
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
            Explore our signature styles, precision cuts, grooming
            experiences, and transformations created by our team.
          </p>

          <a
            href="#gallery-grid"
            className="mt-9 inline-flex items-center gap-3 border border-[#c7a66a] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#e2c58c] transition hover:bg-[#c7a66a] hover:text-[#171714]"
          >
            Explore the gallery
            <ArrowDown size={16} />
          </a>
        </div>
      </section>

      {/* Gallery heading and filters */}
      <section
        id="gallery-grid"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#a17c3e]">
            Our Portfolio
          </p>

          <h2 className="mt-3 font-serif text-3xl sm:text-5xl">
            A Gallery of Style
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
            Every detail matters. Discover the work, creativity, and
            craftsmanship behind our salon experience.
          </p>

          <div className="mx-auto mt-6 h-px w-20 bg-[#c7a66a]" />
        </div>

        {/* Category filters */}
        <div className="mb-10 flex flex-wrap justify-center gap-2 sm:gap-3">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full border px-4 py-2.5 text-xs font-semibold transition-all duration-200 sm:px-5 sm:text-sm ${
                category === item
                  ? "border-[#20201e] bg-[#20201e] text-white shadow-md"
                  : "border-gray-200 bg-white text-gray-600 hover:border-[#c7a66a] hover:text-[#8a682f]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden bg-white"
              >
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-1/4 bg-gray-200" />
                  <div className="h-5 w-2/3 bg-gray-200" />
                  <div className="h-3 w-full bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="mx-auto max-w-xl border border-red-200 bg-white p-8 text-center">
            <p className="font-semibold text-red-700">{error}</p>

            <button
              type="button"
              onClick={fetchGallery}
              className="mt-5 bg-[#20201e] px-5 py-3 text-sm font-semibold text-white hover:bg-[#393831]"
            >
              Try again
            </button>
          </div>
        )}

        {/* Image grid */}
        {!loading && !error && filteredImages.length > 0 && (
          <>
            <div className="mb-5 flex items-center justify-between text-sm text-gray-500">
              <span>
                Showing {filteredImages.length}{" "}
                {filteredImages.length === 1 ? "creation" : "creations"}
              </span>

              <button
                type="button"
                onClick={fetchGallery}
                className="underline decoration-[#c7a66a] underline-offset-4 hover:text-[#8a682f]"
              >
                Refresh gallery
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {filteredImages.map((image, index) => (
                <article
                  key={image._id}
                  className="group cursor-pointer overflow-hidden bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  onClick={() => setActiveImage(image)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#e8e5df]">
                    {imageErrors[image._id] ? (
                      <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 text-gray-500">
                        <ImageIcon size={32} />
                        <span className="text-sm">
                          Image unavailable
                        </span>
                      </div>
                    ) : (
                      <img
                        src={image.imageUrl}
                        alt={image.title || "Salon creation"}
                        loading="lazy"
                        onError={() =>
                          setImageErrors((current) => ({
                            ...current,
                            [image._id]: true,
                          }))
                        }
                        className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
                      />
                    )}

                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 group-hover:bg-black/35">
                      <span className="flex h-12 w-12 translate-y-3 items-center justify-center rounded-full bg-white/95 text-[#20201e] opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <Expand size={20} />
                      </span>
                    </div>

                    {image.category && (
                      <span className="absolute left-4 top-4 bg-[#171714]/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#e4c991]">
                        {image.category}
                      </span>
                    )}

                    <span className="absolute bottom-3 right-4 text-xs font-medium text-white drop-shadow">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="mb-3 h-px w-10 bg-[#c7a66a] transition-all duration-300 group-hover:w-16" />

                    <h3 className="font-serif text-xl text-[#20201e] sm:text-2xl">
                      {image.title || "Salon Creation"}
                    </h3>

                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-500">
                      {image.description || "Crafted with care and attention to detail."}
                    </p>

                    <p className="mt-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#98743b]">
                      View creation
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && !error && filteredImages.length === 0 && (
          <div className="border border-dashed border-gray-300 bg-white px-5 py-16 text-center">
            <ImageIcon
              size={42}
              strokeWidth={1}
              className="mx-auto text-[#b08b4c]"
            />

            <h3 className="mt-5 font-serif text-2xl">
              {category === "All"
                ? "Our gallery is taking shape"
                : "Nothing here just yet"}
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
              {category === "All"
                ? "Beautiful work will appear here as our salon gallery is updated."
                : `There are no images in ${category} yet. Explore our other categories.`}
            </p>

            {category !== "All" && (
              <button
                type="button"
                onClick={() => setCategory("All")}
                className="mt-6 bg-[#20201e] px-6 py-3 text-sm font-semibold text-white hover:bg-[#393831]"
              >
                View all creations
              </button>
            )}
          </div>
        )}

        {/* Footer note */}
        {!loading && !error && images.length > 0 && (
          <div className="mt-16 text-center">
            <div className="mx-auto mb-5 h-px w-16 bg-[#c7a66a]" />
            <p className="font-serif text-2xl italic text-gray-700">
              Your style. Your statement.
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-400">
              Crafted with care
            </p>
          </div>
        )}
      </section>

      {/* Full-screen image viewer */}
      {activeImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Gallery image viewer"
          onClick={() => setActiveImage(null)}
        >
          <button
            type="button"
            aria-label="Close image viewer"
            onClick={() => setActiveImage(null)}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 sm:right-8 sm:top-8"
          >
            <X size={24} />
          </button>

          {filteredImages.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrevious();
                }}
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 sm:left-8"
              >
                <ArrowLeft size={22} />
              </button>

              <button
                type="button"
                aria-label="Next image"
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 sm:right-8"
              >
                <ArrowRight size={22} />
              </button>
            </>
          )}

          <div
            className="flex max-h-full w-full max-w-5xl flex-col items-center"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={activeImage.imageUrl}
              alt={activeImage.title || "Salon creation"}
              className="max-h-[72vh] max-w-full object-contain"
            />

            <div className="mt-5 max-w-2xl text-center text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d4b578]">
                {activeImage.category}
              </p>

              <h3 className="mt-2 font-serif text-2xl sm:text-3xl">
                {activeImage.title}
              </h3>

              {activeImage.description && (
                <p className="mt-2 text-sm leading-6 text-white/65">
                  {activeImage.description}
                </p>
              )}

              {activeIndex >= 0 && (
                <p className="mt-4 text-xs tracking-widest text-white/45">
                  {activeIndex + 1} / {filteredImages.length}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
