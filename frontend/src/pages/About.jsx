
import { Link } from "react-router-dom";
import {
  Scissors,
  Clock,
  Users,
  CalendarCheck,
  Heart,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Less Waiting",
    description:
      "Join a salon queue online and check your position instead of spending unnecessary time waiting.",
  },
  {
    icon: CalendarCheck,
    title: "Easy Queue Access",
    description:
      "View available salon services and join a queue from your device in just a few steps.",
  },
  {
    icon: Users,
    title: "Stay Updated",
    description:
      "Check your queue status and estimated waiting time as your turn approaches.",
  },
  {
    icon: ShieldCheck,
    title: "Customer Focused",
    description:
      "Enjoy a simple, convenient experience designed around your salon visit.",
  },
];

const steps = [
  {
    number: "01",
    title: "Explore Services",
    description:
      "Browse salon services and choose the service that suits you.",
  },
  {
    number: "02",
    title: "Join the Queue",
    description:
      "Log in to your account and join the queue for your selected service.",
  },
  {
    number: "03",
    title: "Track Your Turn",
    description:
      "View your queue number, people ahead, and estimated waiting time.",
  },
  {
    number: "04",
    title: "Enjoy Your Visit",
    description:
      "Follow your queue status and get ready for your salon experience.",
  },
];

export default function About() {
  return (
    <main className="overflow-hidden bg-white text-gray-900">
      {/* Hero */}
      <section className="relative bg-gray-950 text-white">
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:py-32">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-gray-200">
              <Sparkles size={16} className="text-amber-400" />
              Welcome to StyleHub
            </span>

            <h1 className="mt-7 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Your Style.
              <br />
              Your Time.
              <br />
              <span className="text-amber-400">
                Your Experience.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-gray-300 sm:text-lg">
              We make salon visits more convenient with a simple
              online queue management experience. Discover services,
              join a queue, and keep track of your turn without
              unnecessary uncertainty.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/services"
                className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-6 py-3.5 font-semibold text-gray-950 transition hover:bg-amber-300"
              >
                Explore Services
                <ArrowRight size={19} />
              </Link>

              <Link
                to="/contact"
                className="rounded-lg border border-white/25 px-6 py-3.5 font-semibold transition hover:bg-white/10"
              >
                Contact Us
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl">
              <div className="rounded-2xl bg-gray-900 p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-amber-400 p-3 text-gray-950">
                    <Scissors size={28} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">
                      A smarter salon visit
                    </p>
                    <h2 className="text-xl font-bold">
                      Your Queue, Simplified
                    </h2>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-gray-400">
                    Your queue number
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-4">
                    <p className="text-5xl font-bold text-amber-400">
                      #08
                    </p>
                    <span className="rounded-full bg-amber-400/15 px-3 py-1.5 text-sm font-medium text-amber-300">
                      Waiting
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/5 p-4">
                      <Clock size={20} className="text-amber-400" />
                      <p className="mt-3 text-xl font-bold">15 min</p>
                      <p className="mt-1 text-xs text-gray-400">
                        Example wait time
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/5 p-4">
                      <Users size={20} className="text-amber-400" />
                      <p className="mt-3 text-xl font-bold">3</p>
                      <p className="mt-1 text-xs text-gray-400">
                        Example people ahead
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-gray-400">
                    Illustrative preview only. Actual queue details
                    depend on live salon data.
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 -z-0 h-24 w-24 rounded-full bg-amber-400/20 blur-2xl" />
          </div>
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-amber-600">
            About Us
          </span>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
            Making salon visits simpler
          </h2>
          <p className="mt-6 text-base leading-8 text-gray-600 sm:text-lg">
            StyleHub is designed to connect customers with salon
            services through a convenient digital queue experience.
            Our goal is to make it easier to find services, understand
            your queue position, and plan your visit with greater
            confidence.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 p-7 transition hover:-translate-y-1 hover:shadow-lg">
            <Heart size={30} className="text-amber-600" />
            <h3 className="mt-5 text-xl font-bold">Our Mission</h3>
            <p className="mt-3 leading-7 text-gray-600">
              Make salon visits more convenient through accessible
              digital queue management.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 p-7 transition hover:-translate-y-1 hover:shadow-lg">
            <Sparkles size={30} className="text-amber-600" />
            <h3 className="mt-5 text-xl font-bold">Our Approach</h3>
            <p className="mt-3 leading-7 text-gray-600">
              Keep the experience simple, clear, and easy to use on
              both desktop and mobile devices.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 p-7 transition hover:-translate-y-1 hover:shadow-lg">
            <Users size={30} className="text-amber-600" />
            <h3 className="mt-5 text-xl font-bold">Our Focus</h3>
            <p className="mt-3 leading-7 text-gray-600">
              Help customers and salon teams manage queue information
              with greater clarity.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-amber-600">
              Why StyleHub
            </span>
            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              A better way to manage your visit
            </h2>
            <p className="mt-4 leading-7 text-gray-600">
              Helpful features designed to make the salon queue
              experience easier to understand and manage.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-2xl border border-gray-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="inline-flex rounded-xl bg-amber-50 p-3 text-amber-700">
                  <Icon size={25} />
                </div>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-600">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-amber-600">
            How It Works
          </span>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
            Four simple steps
          </h2>
          <p className="mt-4 leading-7 text-gray-600">
            From choosing a service to tracking your turn, the process
            is designed to be straightforward.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="relative">
              <p className="text-4xl font-bold text-amber-500">
                {step.number}
              </p>
              <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
              <p className="mt-3 leading-7 text-gray-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="bg-amber-50 py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 sm:px-8 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold">
              Convenience starts with a better experience.
            </h2>
            <p className="mt-4 leading-7 text-gray-600">
              Explore the services available through StyleHub and
              take the next step toward a simpler salon visit.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-gray-700">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={17} className="text-amber-700" />
                Easy to navigate
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={17} className="text-amber-700" />
                Queue tracking
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={17} className="text-amber-700" />
                Mobile friendly
              </span>
            </div>
          </div>

          <Link
            to="/services"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gray-950 px-6 py-3.5 font-semibold text-white transition hover:bg-gray-800"
          >
            Explore Services
            <ArrowRight size={19} />
          </Link>
        </div>
      </section>
    </main>
  );
}
