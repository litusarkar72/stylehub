
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import axios from "axios";

import { AppProvider } from "./context/AppContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import SalonDetails from "./pages/SalonDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import JoinQueue from "./pages/JoinQueue";
import MyQueue from "./pages/MyQueue";
import QueueHistory from "./pages/QueueHistory";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Service from "./pages/Services";
import Gallery from "./pages/UserGallery";

const API =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

// Temporary placeholder for pages not implemented yet.
function Placeholder({ title }) {
  return (
    <main className="mx-auto max-w-7xl px-5 py-20">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-3 text-gray-600">
        This page will be implemented next.
      </p>
    </main>
  );
}

// Gallery page for a salon ID provided in the URL.
function SalonGallery() {
  const { salonId } = useParams();

  return <Gallery salonId={salonId} />;
}

// Gallery page for the single salon configured in the backend.
function SingleSalonGallery() {
  const [salonId, setSalonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchSalon = async () => {
      try {
        const response = await axios.get(
          `${API}/api/salons/public`
        );

        const salon = response.data.salon;

        if (cancelled) return;

        if (salon?._id) {
          setSalonId(salon._id);
        } else {
          setError("Salon information was not found.");
        }
      } catch (err) {
        if (!cancelled) {
          console.error(
            "Failed to fetch public salon:",
            err.response?.data || err
          );

          setError(
            err.response?.data?.message ||
              "Unable to load salon information. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSalon();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-20 text-center">
        <p className="text-gray-500">
          Loading salon gallery...
        </p>
      </main>
    );
  }

  if (error || !salonId) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Our Gallery
        </h1>

        <p className="mt-3 text-red-600">
          {error || "Salon information is unavailable."}
        </p>
      </main>
    );
  }

  return <Gallery salonId={salonId} />;
}

function NotFound() {
  return <Placeholder title="Page Not Found" />;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          {/* Home */}
          <Route path="/" element={<Home />} />

          {/* Services */}
          <Route path="/services" element={<Service />} />
          <Route path="/service" element={<Service />} />

          {/* Salon details */}
          <Route
            path="/salon/:salonId"
            element={<SalonDetails />}
          />

          {/* Public gallery: automatically finds the single salon */}
          <Route
            path="/gallery"
            element={<SingleSalonGallery />}
          />

          {/* Gallery for a specific salon */}
          <Route
            path="/gallery/:salonId"
            element={<SalonGallery />}
          />

          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Join queue */}
          <Route
            path="/join-queue/:serviceId"
            element={<JoinQueue />}
          />

          {/* Customer queue */}
          <Route path="/my-queue" element={<MyQueue />} />
          <Route
            path="/my-queue/:queueId"
            element={<MyQueue />}
          />
          <Route
            path="/queue-history"
            element={<QueueHistory />}
          />

          {/* Profile */}
          <Route path="/profile" element={<Profile />} />

          {/* About and contact */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Redirect and fallback */}
          <Route
            path="/home"
            element={<Navigate to="/" replace />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>

        <Footer />
      </BrowserRouter>
    </AppProvider>
  );
}
