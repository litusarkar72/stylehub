
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Clock,
  MapPin,
  Scissors,
  Users,
  CreditCard,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";

const API =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

// Load Razorpay Checkout script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

const formatDuration = (minutes = 0) => {
  if (minutes < 60) return `${minutes} minutes`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes
    ? `${hours} hr ${remainingMinutes} min`
    : `${hours} ${hours === 1 ? "hour" : "hours"}`;
};

export default function JoinQueue() {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const { token, isAuthenticated } = useAppContext();

  const [salon, setSalon] = useState(null);
  const [service, setService] = useState(null);

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  // Load salon and service details
  useEffect(() => {
    let cancelled = false;

    const loadDetails = async () => {
      setLoading(true);
      setError("");

      try {
        const [salonResponse, servicesResponse] =
          await Promise.all([
            axios.get(`${API}/api/salons/public`),
            axios.get(`${API}/api/services/public`),
          ]);

        if (cancelled) return;

        const salonData = salonResponse.data?.salon;
        const servicesData =
          servicesResponse.data?.services || [];

        const selectedService = servicesData.find(
          (item) => item._id === serviceId
        );

        if (!salonResponse.data?.success || !salonData) {
          throw new Error("Unable to load salon details.");
        }

        if (!selectedService) {
          throw new Error(
            "This service was not found or is unavailable."
          );
        }

        setSalon(salonData);
        setService(selectedService);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load service details."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  // ========================================
  // RAZORPAY PAYMENT INTEGRATION
  // ========================================

  const handleJoinQueue = async () => {
    setError("");

    if (!isAuthenticated || !token) {
      navigate("/login", {
        state: {
          from: `/join-queue/${serviceId}`,
        },
      });
      return;
    }

    if (!salon?._id || !service?._id) {
      setError("Salon or service details are missing.");
      return;
    }

    setJoining(true);

    try {
      // Step 1: Load Razorpay Checkout
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error(
          "Unable to load Razorpay. Please check your internet connection."
        );
      }

      // Step 2: Create payment order on backend
      const orderResponse = await axios.post(
        `${API}/api/payment/create-order`,
        {
          serviceId: service._id,
        },
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!orderResponse.data?.success) {
        throw new Error(
          orderResponse.data?.message ||
            "Unable to create payment order."
        );
      }

      const {
        keyId,
        orderId,
        amount,
        currency,
        serviceName,
        salonName,
      } = orderResponse.data;

      if (!keyId || !orderId || !amount) {
        throw new Error(
          "Invalid payment order received from server."
        );
      }

      // Step 3: Open Razorpay Checkout
      const options = {
        key: keyId,

        amount,
        currency,
        name: "StyleHub",
        description: `${serviceName || service.name} - ${salonName || salon.name}`,
        order_id: orderId,

        theme: {
          color: "#c86b50",
        },

        modal: {
          ondismiss: () => {
            setJoining(false);
            setError(
              "Payment window closed. Your queue has not been confirmed."
            );
          },
        },

        // Step 4: Razorpay returns payment details
        handler: async function (paymentResponse) {
          try {
            setError("");

            // Step 5: Verify payment on backend
            const verifyResponse = await axios.post(
              `${API}/api/payment/verify`,
              {
                razorpay_order_id:
                  paymentResponse.razorpay_order_id,

                razorpay_payment_id:
                  paymentResponse.razorpay_payment_id,

                razorpay_signature:
                  paymentResponse.razorpay_signature,
              },
              {
                withCredentials: true,
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!verifyResponse.data?.success) {
              throw new Error(
                verifyResponse.data?.message ||
                  "Payment verification failed."
              );
            }

            const queueId =
              verifyResponse.data?.queue?._id;

            if (!queueId) {
              throw new Error(
                "Payment was verified, but queue details were not returned. Please contact support."
              );
            }

            // Step 6: Navigate to confirmed queue
            navigate(`/my-queue/${queueId}`, {
              replace: true,
            });
          } catch (err) {
            console.error(
              "Payment verification error:",
              err.response?.data || err.message
            );

            setError(
              "We received your payment response, but could not confirm your booking. Please do not pay again. Contact support with payment ID: " +
                paymentResponse.razorpay_payment_id
            );

            setJoining(false);
          }
        },
      };

      const razorpay = new window.Razorpay(options);

      // Handle payment failure
      razorpay.on("payment.failed", (response) => {
        console.error(
          "Razorpay payment failed:",
          response.error
        );

        setError(
          response.error?.description ||
            "Payment failed. Please try again."
        );

        setJoining(false);
      });

      razorpay.open();
    } catch (err) {
      console.error(
        "Payment initiation error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to start payment. Please try again."
      );

      setJoining(false);
    }
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">
          Loading service details...
        </p>
      </main>
    );
  }

  // ========================================
  // SERVICE UNAVAILABLE
  // ========================================

  if (!salon || !service) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">
          Service unavailable
        </h1>

        <p className="mt-3 text-gray-600">
          {error || "We could not find this service."}
        </p>

        <Link
          to="/services"
          className="mt-6 inline-block rounded-lg bg-black px-5 py-3 text-white"
        >
          Browse services
        </Link>
      </main>
    );
  }

  // ========================================
  // MAIN PAGE
  // ========================================

  return (
    <main className="min-h-[80vh] bg-gray-50 px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">

        <Link
          to="/services"
          className="text-sm font-medium text-gray-600 hover:text-black"
        >
          ← Back to services
        </Link>

        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

          {service.image && (
            <img
              src={service.image}
              alt={service.name}
              className="h-64 w-full object-cover sm:h-80"
            />
          )}

          <div className="p-6 sm:p-8">

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Scissors size={18} />
              <span>StyleHub Salon</span>
            </div>

            <h1 className="mt-3 text-3xl font-bold">
              Book your salon service
            </h1>

            <p className="mt-2 text-gray-600">
              Review your service and complete payment to
              confirm your queue booking.
            </p>

            {/* SERVICE DETAILS */}

            <div className="mt-7 rounded-xl bg-gray-50 p-5">
              <h2 className="text-xl font-semibold">
                {service.name}
              </h2>

              {service.description && (
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {service.description}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm">

                <span className="font-semibold text-gray-900">
                  ₹{service.price}
                </span>

                <span className="flex items-center gap-2 text-gray-600">
                  <Clock size={17} />
                  {formatDuration(service.duration)}
                </span>

              </div>
            </div>

            {/* SALON DETAILS */}

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-gray-100 p-4">

              <MapPin size={20} className="mt-1 shrink-0" />

              <div>
                <h3 className="font-semibold">
                  {salon.name}
                </h3>

                <p className="mt-1 text-sm text-gray-600">
                  {[salon.address, salon.city]
                    .filter(Boolean)
                    .join(", ")}
                </p>

                {salon.openingTime &&
                  salon.closingTime && (
                    <p className="mt-2 text-sm text-gray-500">
                      Hours: {salon.openingTime} – {salon.closingTime}
                    </p>
                  )}
              </div>
            </div>

            {/* QUEUE INFORMATION */}

            <div className="mt-5 flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-900">

              <Users size={20} className="mt-0.5 shrink-0" />

              <p>
                After successful payment, your queue
                number will be generated. You can then
                view your queue position and estimated
                waiting time.
              </p>
            </div>

            {/* PAYMENT INFORMATION */}

            <div className="mt-5 flex items-center justify-between rounded-xl border border-gray-200 p-4">

              <div className="flex items-center gap-3">
                <CreditCard
                  size={21}
                  className="text-[#c86b50]"
                />

                <div>
                  <p className="font-semibold text-gray-900">
                    Online payment
                  </p>

                  <p className="text-xs text-gray-500">
                    UPI, cards and available payment methods
                  </p>
                </div>
              </div>

              <span className="font-bold text-gray-900">
                ₹{service.price}
              </span>
            </div>

            {/* ERROR MESSAGE */}

            {error && (
              <p
                role="alert"
                className="mt-5 rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-700"
              >
                {error}
              </p>
            )}

            {/* PAYMENT BUTTON */}

            <button
              type="button"
              onClick={handleJoinQueue}
              disabled={joining}
              className="mt-6 w-full rounded-lg bg-[#c86b50] px-5 py-3.5 font-semibold text-white transition hover:bg-[#ad523b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {joining
                ? "Processing..."
                : !isAuthenticated
                  ? "Log in to Continue"
                  : `Pay ₹${service.price} & Confirm Booking`}
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-gray-500">
              Your queue booking is confirmed only after
              successful payment verification.
            </p>

          </div>
        </div>
      </div>
    </main>
  );
}
