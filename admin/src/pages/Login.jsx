
import { useContext, useState } from "react";
import axios from "axios";

import { AdminContext } from "../context/AdminContext";

import { Link, useNavigate } from "react-router-dom";

import {
  Scissors,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Crown,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const Login = () => {
  const { backendUrl, login } = useContext(AdminContext);

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // ADMIN LOGIN
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");

    try {
      setLoading(true);

      // STEP 1: Call ADMIN login API.
      const { data } = await axios.post(
        `${backendUrl.replace(/\/$/, "")}/api/auth/admin/login`,
        {
          email: email.trim().toLowerCase(),
          password,
        },
        {
          withCredentials: true,
        }
      );

      if (!data?.success) {
        throw new Error(
          data?.message || "Admin login failed."
        );
      }

      // STEP 2: Get admin details.
      const admin = data.admin || data.user;
      const receivedToken = data.token;

      if (!admin || !receivedToken) {
        throw new Error(
          "Invalid admin login response from server."
        );
      }

      // STEP 3: Verify admin role.
      if (admin.role !== "admin") {
        throw new Error(
          "You are not authorized to access the admin panel."
        );
      }

      // STEP 4: Get salon ID.
      let salonId =
        admin.salonId?._id ||
        admin.salonId ||
        null;

      // STEP 5: Fetch salon details if salon ID is missing.
      if (!salonId) {
        try {
          const salonResponse = await axios.get(
            `${backendUrl.replace(/\/$/, "")}/api/salons/my`,
            {
              headers: {
                Authorization: `Bearer ${receivedToken}`,
              },
              withCredentials: true,
            }
          );

          if (salonResponse.data?.success) {
            const salon =
              salonResponse.data.salon;

            salonId =
              salon?._id ||
              salonResponse.data.salonId ||
              null;
          }
        } catch (salonError) {
          // A new salon owner may not have registered a salon yet.
          if (salonError.response?.status === 404) {
            salonId = null;
          } else {
            throw new Error(
              salonError.response?.data?.message ||
              "Unable to fetch your salon details."
            );
          }
        }
      }

      // STEP 6: Prepare admin information.
      const updatedAdmin = {
        ...admin,
        salonId,
        role: "admin",
      };

      // STEP 7: Save admin authentication.
      login(receivedToken, updatedAdmin);

      // STEP 8: Navigate to the correct page.
      if (salonId) {
        navigate("/dashboard", {
          replace: true,
        });
      } else {
        navigate("/salon-register", {
          replace: true,
        });
      }

    } catch (err) {
      console.error(
        "ADMIN LOGIN ERROR:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090909] px-4 py-10 text-white">

      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#c6a15b]/10 blur-[120px]" />

      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#c6a15b]/10 blur-[120px]" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#c6a15b]/20 bg-[#141414] p-7 shadow-2xl shadow-black/50 sm:p-10">

        {/* Brand */}
        <Link to="/" className="mb-9 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#b08a42] to-[#e1c47b] text-black">
            <Scissors size={25} />
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-wide">
              StyleHub
            </h2>

            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c6a15b]">
              Premium Salon
            </p>
          </div>
        </Link>

        {/* Icon */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c6a15b]/30 bg-[#c6a15b]/10">
          <Crown
            size={30}
            className="text-[#d5b46a]"
          />
        </div>

        {/* Heading */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#c6a15b]">
            <Sparkles size={14} />
            Owner Access
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Welcome Back
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            Sign in to manage your salon, services and customer queue.
          </p>
        </div>

        {/* Login form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm leading-6 text-red-400"
            >
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-gray-300"
            >
              Email Address
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c6a15b]"
              />

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0d0d0d] py-3.5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#c6a15b]"
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-gray-300"
            >
              Password
            </label>

            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c6a15b]"
              />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0d0d0d] py-3.5 pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#c6a15b]"
                autoComplete="current-password"
                required
                disabled={loading}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-[#d5b46a]"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b08a42] to-[#e1c47b] py-3.5 font-bold text-black shadow-lg shadow-[#c6a15b]/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              "Signing in..."
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Register */}
        <div className="mt-8 border-t border-white/10 pt-6 text-center">
          <p className="text-sm text-gray-400">
            New salon owner?
          </p>

          <Link
            to="/register"
            className="mt-2 inline-block font-semibold text-[#d5b46a] underline-offset-4 transition hover:underline"
          >
            Register Your Salon
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-7 text-center text-[11px] tracking-wide text-gray-600">
          <Lock size={11} className="mr-1 inline" />
          Secure Admin Access · StyleHub Premium
        </p>

      </div>
    </main>
  );
};

export default Login;
