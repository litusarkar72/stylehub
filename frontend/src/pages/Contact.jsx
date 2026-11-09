
import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  Headphones,
  Loader2,
  ExternalLink,
} from "lucide-react";

const API =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const GOOGLE_MAPS_LINK =
  "https://maps.app.goo.gl/LkMiBmz4sxb65JXY6";

const initialForm = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const faqs = [
  {
    question: "How do I join a salon queue?",
    answer:
      "Visit the Services page, select a service, log in to your account, and follow the instructions to join the queue.",
  },
  {
    question: "How can I check my queue status?",
    answer:
      "Open My Queue from your profile menu to view your queue number, current status, and estimated waiting time when available.",
  },
  {
    question: "Where can I see my previous visits?",
    answer:
      "Log in to your account and open Queue History to view your previous queue entries.",
  },
];

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // HANDLE INPUT CHANGE
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setSubmitted(false);
    setServerError("");
  };

  // VALIDATE FORM
  const validateForm = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Please enter your name.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!form.subject.trim()) {
      nextErrors.subject = "Please enter a subject.";
    }

    if (form.message.trim().length < 10) {
      nextErrors.message =
        "Please enter at least 10 characters.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  // SEND CONTACT MESSAGE
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setSubmitted(false);
      setServerError("");
      setEmailSent(false);

      const response = await axios.post(
        `${API}/api/contact/send`,
        {
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
        }
      );

      if (response.data.success) {
        setSubmitted(true);
        setEmailSent(Boolean(response.data.emailSent));
        setForm(initialForm);
        setErrors({});
      } else {
        setServerError(
          response.data.message || "Unable to send your message."
        );
      }
    } catch (error) {
      console.error(
        "Contact form error:",
        error.response?.data || error.message
      );

      setServerError(
        error.response?.data?.message ||
          "Unable to send your message. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // INPUT STYLES
  const inputClass =
    "mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100";

  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gray-950 text-white">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-gray-200">
            <MessageCircle size={17} className="text-amber-400" />
            We're here to help
          </span>

          <h1 className="mt-7 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Let's talk about
            <span className="text-amber-400">
              {" "}your experience.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-gray-300 sm:text-lg">
            Have a question about StyleHub, your salon queue, or our
            services? Explore the information below and get in touch
            with our team.
          </p>

          <Link
            to="/services"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-6 py-3.5 font-semibold text-gray-950 transition hover:bg-amber-300"
          >
            Explore Services
            <ArrowRight size={19} />
          </Link>
        </div>
      </section>

      {/* CONTACT INFORMATION AND FORM */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">

          {/* CONTACT INFORMATION */}
          <div>
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-amber-700">
              Contact Information
            </span>

            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              We'd love to hear from you
            </h2>

            <p className="mt-5 leading-8 text-gray-600">
              Need help using the platform? Have feedback or a
              suggestion? Check our frequently asked questions or
              contact us using the details provided by your StyleHub
              team.
            </p>

            <div className="mt-9 space-y-4">

              {/* EMAIL SUPPORT */}
              <div className="flex items-start gap-4 rounded-2xl border border-gray-100 p-5 transition hover:shadow-md">
                <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
                  <Mail size={22} />
                </div>

                <div>
                  <h3 className="font-semibold">Email Support</h3>
                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    For account, queue, or service questions.
                  </p>

                  <a
                    href="mailto:stylehub@gmail.com"
                    className="mt-2 inline-block text-sm font-medium text-amber-700 hover:underline"
                  >
                    stylehub@gmail.com
                  </a>
                </div>
              </div>

              {/* PHONE SUPPORT */}
              <div className="flex items-start gap-4 rounded-2xl border border-gray-100 p-5 transition hover:shadow-md">
                <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
                  <Phone size={22} />
                </div>

                <div>
                  <h3 className="font-semibold">Phone Support</h3>
                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    For assistance with your salon visit.
                  </p>

                  <a
                    href="tel:+917853010939"
                    className="mt-2 inline-block text-sm font-medium text-amber-700 hover:underline"
                  >
                    +91 7853010939
                  </a>
                </div>
              </div>

              {/* SUPPORT HOURS */}
              <div className="flex items-start gap-4 rounded-2xl border border-gray-100 p-5 transition hover:shadow-md">
                <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
                  <Clock size={22} />
                </div>

                <div>
                  <h3 className="font-semibold">Support Hours</h3>
                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Our support team is available for 9 hours daily.
                  </p>

                  <p className="mt-2 text-sm font-medium text-amber-700">
                    9 Hours Daily
                  </p>
                </div>
              </div>

              {/* GOOGLE MAPS LOCATION */}
              <div className="flex items-start gap-4 rounded-2xl border border-gray-100 p-5 transition hover:shadow-md">
                <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
                  <MapPin size={22} />
                </div>

                <div>
                  <h3 className="font-semibold">Our Location</h3>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Find our StyleHub location and get directions.
                  </p>

                  <a
                    href={GOOGLE_MAPS_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                  >
                    View on Map
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* CONTACT FORM */}
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8 lg:p-10">

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gray-950 p-3 text-white">
                <Send size={22} />
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  Send us a message
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Fill in the form below.
                </p>
              </div>
            </div>

            {/* SUCCESS MESSAGE */}
            {submitted && (
              <div
                role="status"
                className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
              >
                <CheckCircle2 size={21} className="shrink-0" />

                <div>
                  <p className="font-semibold">
                    Message submitted successfully!
                  </p>

                  <p className="mt-1">
                    Thank you for contacting StyleHub. Our team
                    will review your message.
                  </p>

                  <p className="mt-2">
                    {emailSent
                      ? "Email notification sent to our support team."
                      : "Your message is saved, but the email notification could not be sent."}
                  </p>
                </div>
              </div>
            )}

            {/* ERROR MESSAGE */}
            {serverError && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {serverError}
              </div>
            )}

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
              noValidate
            >
              <div className="grid gap-5 sm:grid-cols-2">

                {/* NAME */}
                <div>
                  <label
                    htmlFor="name"
                    className="text-sm font-semibold"
                  >
                    Full name
                  </label>

                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    autoComplete="name"
                    maxLength={100}
                    className={inputClass}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={
                      errors.name ? "name-error" : undefined
                    }
                  />

                  {errors.name && (
                    <p id="name-error" className="mt-1 text-sm text-red-600">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* EMAIL */}
                <div>
                  <label
                    htmlFor="email"
                    className="text-sm font-semibold"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    maxLength={254}
                    className={inputClass}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                      errors.email ? "email-error" : undefined
                    }
                  />

                  {errors.email && (
                    <p id="email-error" className="mt-1 text-sm text-red-600">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* SUBJECT */}
              <div>
                <label
                  htmlFor="subject"
                  className="text-sm font-semibold"
                >
                  Subject
                </label>

                <input
                  id="subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  maxLength={150}
                  className={inputClass}
                  aria-invalid={Boolean(errors.subject)}
                  aria-describedby={
                    errors.subject ? "subject-error" : undefined
                  }
                />

                {errors.subject && (
                  <p id="subject-error" className="mt-1 text-sm text-red-600">
                    {errors.subject}
                  </p>
                )}
              </div>

              {/* MESSAGE */}
              <div>
                <label
                  htmlFor="message"
                  className="text-sm font-semibold"
                >
                  Your message
                </label>

                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Write your message here..."
                  maxLength={5000}
                  className={`${inputClass} resize-y`}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={
                    errors.message ? "message-error" : undefined
                  }
                />

                {errors.message && (
                  <p id="message-error" className="mt-1 text-sm text-red-600">
                    {errors.message}
                  </p>
                )}
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-6 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <Send size={18} />
                  </>
                )}
              </button>

              <p className="text-xs leading-5 text-gray-400">
                Your message will be securely submitted to the
                StyleHub support team.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">

          <div className="text-center">
            <div className="inline-flex rounded-xl bg-amber-50 p-3 text-amber-700">
              <Headphones size={26} />
            </div>

            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              Frequently asked questions
            </h2>

            <p className="mt-4 text-gray-600">
              Quick answers to common questions about StyleHub.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-gray-100 bg-white p-5 open:shadow-sm sm:p-6"
              >
                <summary className="cursor-pointer list-none pr-4 font-semibold">
                  <span className="flex items-center justify-between gap-4">
                    {faq.question}

                    <span className="text-xl text-amber-700 transition group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>

                <p className="mt-4 leading-7 text-gray-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-600">
              Need help with your next visit?
            </p>

            <Link
              to="/services"
              className="mt-4 inline-flex items-center gap-2 font-semibold text-gray-900 underline decoration-amber-500 decoration-2 underline-offset-4 hover:text-amber-700"
            >
              Browse salon services
              <ArrowRight size={18} />
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}
