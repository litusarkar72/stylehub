import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock,
  Heart,
  Sparkles,
  Star,
  Scissors,
  Waves,
  MapPin,
} from "lucide-react";

import SalonInfo from "../components/SalonInfo";

// Different images for different men's grooming services.
const services = [
  {
    name: "Men's Haircut & Styling",
    category: "CUT & STYLE",
    description:
      "Discover a fresh haircut that matches your personality and style.",
    price: "Explore pricing",
    duration: "30–45 min",
    image:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=85",
    icon: Scissors,
  },
  {
    name: "Beard Grooming",
    category: "BEARD & GROOMING",
    description:
      "Keep your beard sharp and well-groomed with professional care.",
    price: "Explore pricing",
    duration: "20–30 min",
    image:
      "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=900&q=85",
    icon: Waves,
  },
  {
    name: "Hair & Skin Care",
    category: "CARE & STYLE",
    description:
      "Refresh your look with a grooming experience designed for you.",
    price: "Explore pricing",
    duration: "30–60 min",
    image:
      "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&q=85",
    icon: Sparkles,
  },
];

const benefits = [
  {
    icon: CalendarDays,
    title: "Easy Salon Discovery",
    description:
      "Explore salon information and discover available services in one place.",
  },
  {
    icon: Clock,
    title: "Live Queue Updates",
    description:
      "Track your queue position and follow your salon visit progress.",
  },
  {
    icon: Heart,
    title: "A Better Experience",
    description:
      "Find your preferred salon and make your next visit easier to plan.",
  },
];

const galleryImages = [
  {
    src: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=85",
    alt: "Men's barber shop",
    title: "Men's Grooming",
  },
  {
    src: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=85",
    alt: "Man getting a haircut at a barbershop",
    title: "Modern Haircuts",
  },
  {
    src: "https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=900&q=85",
    alt: "Professional grooming tools and barber setup",
    title: "The Details Matter",
  },
];

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#C66A46]">
        {eyebrow}
      </p>

      <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
        {title}
      </h2>

      {description && (
        <p className="mt-4 text-sm leading-7 text-gray-500 sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({
        top: 0,
        behavior: "auto",
      });
      return;
    }

    const id = decodeURIComponent(location.hash.slice(1));
    let attempts = 0;
    let timeoutId;
    let cancelled = false;

    const scrollToSection = () => {
      if (cancelled) return;

      const section = document.getElementById(id);

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return;
      }

      if (attempts < 10) {
        attempts += 1;
        timeoutId = window.setTimeout(scrollToSection, 100);
      }
    };

    scrollToSection();

    return () => {
      cancelled = true;

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [location.pathname, location.hash]);

  return (
    <main className="overflow-hidden bg-[#FBF7F2] text-[#241B17]">
      {/* ================= HERO SECTION ================= */}
      <section
        id="home"
        className="relative scroll-mt-24 overflow-hidden bg-[#FBF7F2] px-5 py-12 sm:px-8 lg:px-12 lg:py-20"
      >
        <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#F0DCCB]/50 blur-3xl" />

        <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-[#E9B9A4]/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            {/* LEFT: SALON DETAILS */}
            <div className="min-w-0 rounded-[28px] border border-[#EADCCF] bg-white p-4 shadow-xl shadow-[#573A29]/5 sm:p-6">
              <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#C66A46]">
                <MapPin size={16} />
                Discover Your Salon
              </div>

              <SalonInfo />
            </div>

            {/* RIGHT: HERO CONTENT */}
            <div className="relative min-w-0 py-5 lg:py-8">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#E9D7C7] bg-white px-4 py-2 text-xs font-bold text-[#8E624C] shadow-sm">
                <Sparkles size={15} className="text-[#D96C50]" />
                YOUR STYLE, YOUR CONFIDENCE
              </div>

              <h1 className="text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
                Look sharp.
                <span className="block font-serif font-normal italic text-[#D96C50]">
                  Feel confident.
                </span>
                Own your
                <span className="block">style.</span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-8 text-gray-600 sm:text-lg">
                Discover modern men's haircuts, expert beard
                grooming, and professional salon services.
                With StyleHub, finding your next grooming
                experience is easier than ever.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/services"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D96C50] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-orange-900/10 transition hover:-translate-y-1 hover:bg-[#B95239]"
                >
                  Explore Services
                  <ArrowRight size={18} />
                </Link>

                <a
                  href="#about"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E3D7CB] bg-white px-6 py-4 text-sm font-bold text-[#241B17] transition hover:bg-[#FFF0E5]"
                >
                  About StyleHub
                  <ArrowUpRight size={18} />
                </a>
              </div>

              {/* HERO IMAGE 1: BARBERSHOP */}
              <div className="group relative mt-10 overflow-hidden rounded-[28px] border-[5px] border-white shadow-xl shadow-[#573A29]/10">
                <img
                  src="https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1200&q=90"
                  alt="Men's grooming and personal styling"
                  loading="eager"
                  className="h-64 w-full object-cover transition duration-700 group-hover:scale-105 sm:h-80"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-200">
                    THE STYLEHUB GROOMING EXPERIENCE
                  </p>

                  <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                    Your look.
                    <br />
                    Your statement.
                  </h2>

                  <p className="mt-2 text-sm text-white/80">
                    Fresh cuts. Sharp beards. Timeless style.
                  </p>
                </div>
              </div>

              {/* VISIT CARD */}
              <div className="relative z-10 ml-auto -mt-5 mr-3 flex w-fit items-center gap-3 rounded-2xl border border-[#EFE5DB] bg-white p-4 shadow-xl sm:mr-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF0E5] text-[#D96C50]">
                  <CalendarDays size={22} />
                </div>

                <div>
                  <p className="text-sm font-bold">
                    Your Next Visit
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Start with a service
                  </p>
                </div>

                <ArrowUpRight
                  size={19}
                  className="text-[#D96C50]"
                />
              </div>
            </div>
          </div>

          <div className="mt-10">
            <a
              href="#services"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#9A6047] transition hover:text-[#D96C50]"
            >
              Explore Below
              <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </section>

      {/* ================= SERVICES SECTION ================= */}
      <section
        id="services"
        className="scroll-mt-24 bg-white px-5 py-20 sm:px-8 lg:px-12 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="GROOMING & SELF-CARE"
            title="Your style, your way."
            description="Explore men's haircuts, beard grooming, and personal care services that help you look and feel your best."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <article
                  key={service.name}
                  className="group overflow-hidden rounded-3xl border border-[#F0E6DD] bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.name}
                      loading="lazy"
                      className="h-64 w-full object-cover transition duration-700 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    <span className="absolute left-4 top-4 rounded-full border border-white/50 bg-white/90 px-3 py-2 text-[10px] font-bold tracking-[0.15em] text-[#754A36] backdrop-blur">
                      {service.category}
                    </span>

                    <div className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#D96C50] shadow-md">
                      <Icon size={21} />
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <h3 className="text-xl font-bold">
                      {service.name}
                    </h3>

                    <p className="mt-3 min-h-12 text-sm leading-6 text-gray-500">
                      {service.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#F0E8E0] pt-4">
                      <div>
                        <p className="text-sm font-bold text-[#D96C50]">
                          {service.price}
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock size={13} />
                          {service.duration}
                        </p>
                      </div>

                      <Link
                        to="/services"
                        aria-label={`Explore ${service.name}`}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F9EDE3] text-[#A45C41] transition hover:bg-[#D96C50] hover:text-white"
                      >
                        <ArrowUpRight size={21} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 rounded-xl bg-[#241B17] px-7 py-4 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-[#493126]"
            >
              View All Services
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= ABOUT SECTION ================= */}
      <section
        id="about"
        className="scroll-mt-24 px-5 py-20 sm:px-8 lg:px-12 lg:py-24"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* DIFFERENT ABOUT IMAGES */}
          <div className="relative pb-8">
            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1761931403671-d020a14928d9?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"
                alt="Professional men's haircut"
                loading="lazy"
                className="h-64 w-full rounded-2xl object-cover shadow-lg sm:h-80"
              />

              <img
                src="https://images.unsplash.com/photo-1620331311520-246422fd82f9?auto=format&fit=crop&w=700&q=85"
                alt="Men's hairstyle and grooming"
                loading="lazy"
                className="h-64 w-full rounded-2xl object-cover shadow-lg sm:h-80"
              />
            </div>

            <div className="absolute -bottom-1 left-1/2 w-[85%] -translate-x-1/2 rounded-2xl border border-[#EFE3D7] bg-white p-4 shadow-xl sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF0E5] text-[#D96C50]">
                  <Sparkles size={22} />
                </div>

                <div>
                  <p className="text-sm font-bold">
                    Your style matters.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Make every haircut count.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 lg:mt-0">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#C66A46]">
              A BETTER SALON EXPERIENCE
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Great style should feel{" "}
              <span className="font-serif font-normal italic text-[#D96C50]">
                effortless.
              </span>
            </h2>

            <p className="mt-6 text-sm leading-8 text-gray-600 sm:text-base">
              StyleHub helps you discover salons, explore
              men's haircuts and grooming services, and follow
              your queue so you can plan your next visit with
              greater confidence.
            </p>

            <div className="mt-7 space-y-4">
              {[
                "Explore salon information in one place",
                "Find haircut and beard grooming services",
                "Keep track of your queue position",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F1E1D3] text-[#A45C41]">
                    <Check size={15} />
                  </span>

                  <p className="text-sm leading-6 text-gray-700">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <Link
              to="/services"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#D96C50] px-6 py-4 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-[#B95239]"
            >
              Start Exploring
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= BENEFITS SECTION ================= */}
      <section className="bg-[#F2E8DD] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="THE STYLEHUB DIFFERENCE"
            title="Less waiting. More you."
            description="Discover a simpler way to plan and manage your salon visit."
          />

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <article
                  key={benefit.title}
                  className="rounded-2xl border border-white/70 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-7"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0E5] text-[#C66A46]">
                    <Icon size={23} />
                  </div>

                  <h3 className="mt-5 text-lg font-bold">
                    {benefit.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-gray-500">
                    {benefit.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= GALLERY SECTION ================= */}
      <section
        id="gallery"
        className="scroll-mt-24 bg-white px-5 py-20 sm:px-8 lg:px-12 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#C66A46]">
                A GLIMPSE OF THE EXPERIENCE
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                The art of men's grooming.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-gray-500 sm:text-base">
                Get inspired by fresh cuts, sharp beard styles,
                and professional grooming experiences.
              </p>
            </div>

            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#B95C40] transition hover:text-[#D96C50]"
            >
              Explore Gallery
              <ArrowUpRight size={18} />
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryImages.map((item, index) => (
              <Link
                key={item.title}
                to="/gallery"
                className="group relative overflow-hidden rounded-2xl"
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  className={`w-full object-cover transition duration-700 group-hover:scale-105 ${
                    index === 1
                      ? "h-64 sm:h-full sm:min-h-[340px]"
                      : "h-64"
                  }`}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-5 text-white">
                  <div>
                    <p className="text-lg font-bold">
                      {item.title}
                    </p>

                    <p className="mt-1 text-xs text-white/75">
                      Discover the StyleHub experience
                    </p>
                  </div>

                  <ArrowUpRight
                    size={21}
                    className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CONTACT SECTION ================= */}
      <section
        id="contact"
        className="scroll-mt-24 px-5 py-20 sm:px-8 lg:px-12 lg:py-24"
      >
        <div className="mx-auto grid max-w-7xl gap-10 overflow-hidden rounded-[2rem] bg-[#241B17] p-7 text-white shadow-2xl shadow-[#573A29]/15 sm:p-10 lg:grid-cols-2 lg:items-center lg:p-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-200">
              WE'RE HERE TO HELP
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Let's make your
              <span className="block font-serif font-normal italic text-[#E8A17E]">
                next visit special.
              </span>
            </h2>

            <p className="mt-5 max-w-lg text-sm leading-7 text-white/65 sm:text-base">
              Have a question about discovering a salon or
              tracking your queue? We're here to help make
              your StyleHub experience easier.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/services"
                className="inline-flex items-center gap-2 rounded-xl bg-[#D96C50] px-6 py-4 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-[#B95239]"
              >
                Find a Service
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-4 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Contact Us
              </Link>
            </div>
          </div>

          {/* DIFFERENT CONTACT IMAGE */}
          <div className="group relative min-h-[280px] overflow-hidden rounded-2xl border border-white/10 sm:min-h-[340px]">
            <img
              src="https://images.unsplash.com/photo-1592647420148-bfcc177e2117?auto=format&fit=crop&w=1000&q=85"
              alt="Barbershop grooming experience"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#241B17]/80 via-transparent to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <div className="flex items-center gap-2 text-sm text-white/90">
                <Star
                  size={16}
                  className="fill-orange-200 text-orange-200"
                />
                <span>Make time for yourself</span>
              </div>

              <p className="mt-3 text-2xl font-bold sm:text-3xl">
                Your style.
                <br />
                Your moment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FINAL CALL TO ACTION ================= */}
      <section className="px-5 pb-16 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 rounded-2xl border border-[#E8D9CA] bg-white p-6 text-center shadow-sm sm:p-8 md:flex-row md:text-left">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">
              Ready for a fresh look?
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Explore services and discover your next grooming experience.
            </p>
          </div>

          <Link
            to="/services"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#241B17] px-6 py-4 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-[#493126]"
          >
            Explore Services
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
