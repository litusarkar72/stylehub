
import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Crown,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { AdminContext } from "../context/AdminContext";

const Register = () => {
  const { backendUrl } = useContext(AdminContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    invitationCode: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showInvitationCode, setShowInvitationCode] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
  };

  // Handle registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Name validation
    if (form.name.trim().length < 2) {
      setError("Please enter a valid full name.");
      return;
    }

    // Email validation
    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    // Phone validation
    if (!form.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!/^[+]?[0-9\s()-]{7,20}$/.test(form.phone.trim())) {
      setError("Please enter a valid phone number.");
      return;
    }

    // Password validation
    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    // Confirm password validation
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Invitation code validation
    if (!form.invitationCode.trim()) {
      setError("Please enter your admin registration code.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await axios.post(
        `${backendUrl}/api/auth/register-admin`,
        {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
          invitationCode: form.invitationCode.trim(),
        }
      );

      if (data.success) {
        navigate("/login", {
          state: {
            registered: true,
            email: form.email.trim().toLowerCase(),
          },
        });
      } else {
        setError(data.message || "Registration failed.");
      }
    } catch (err) {
      console.error("Admin registration error:", err);

      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0d0d0d] py-3.5 pl-11 pr-12 text-sm text-white placeholder:text-gray-600 outline-none transition focus:border-[#c6a15b]/70 focus:ring-2 focus:ring-[#c6a15b]/10";

  const labelClass =
    "mb-2 block text-sm font-medium text-gray-300";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090909] px-4 py-10 text-white">

      {/* BACKGROUND DECORATION */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#c6a15b]/[0.07] blur-[120px]" />

      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#c6a15b]/[0.05] blur-[120px]" />

      <div className="relative z-10 w-full max-w-lg">

        {/* BRAND */}
        <div className="mb-7 text-center">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c6a15b]/30 bg-[#c6a15b]/10 shadow-lg shadow-[#c6a15b]/10">
            <Crown size={30} className="text-[#d5b46a]" />
          </div>

          <div className="mb-2 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#c6a15b]">
            <Sparkles size={14} />
            Premium Salon Platform
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Create Your Account
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            Register as a salon owner and manage your business.
          </p>
        </div>

        {/* REGISTRATION CARD */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#141414] p-6 shadow-2xl shadow-black/40 sm:p-8">

          {/* ERROR MESSAGE */}
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* FULL NAME */}
            <div>
              <label className={labelClass}>Full Name</label>

              <div className="relative">
                <User
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c6a15b]"
                />

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label className={labelClass}>Email Address</label>

              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c6a15b]"
                />

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="owner@example.com"
                  autoComplete="email"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            {/* PHONE NUMBER */}
            <div>
              <label className={labelClass}>Phone Number</label>

              <div className="relative">
                <Phone
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c6a15b]"
                />

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className={labelClass}>Password</label>

              <div className="relative">
                <Lock
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c6a15b]"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  minLength={6}
                  className={inputClass}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-[#d5b46a]"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className={labelClass}>Confirm Password</label>

              <div className="relative">
                <Lock
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c6a15b]"
                />

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Enter password again"
                  autoComplete="new-password"
                  minLength={6}
                  className={inputClass}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-[#d5b46a]"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* INVITATION CODE */}
            <div>
              <label className={labelClass}>
                Admin Registration Code
              </label>

              <div className="relative">
                <Crown
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c6a15b]"
                />

                <input
                  type={showInvitationCode ? "text" : "password"}
                  name="invitationCode"
                  value={form.invitationCode}
                  onChange={handleChange}
                  placeholder="Enter invitation code"
                  autoComplete="off"
                  className={inputClass}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowInvitationCode(!showInvitationCode)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-[#d5b46a]"
                  aria-label={
                    showInvitationCode ? "Hide code" : "Show code"
                  }
                >
                  {showInvitationCode ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-gray-500">
                Request this registration code from the platform administrator.
              </p>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b08a42] to-[#e1c47b] py-3.5 font-bold text-black shadow-lg shadow-[#c6a15b]/10 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  Creating Account...
                </>
              ) : (
                <>
                  Register as Salon Owner
                  <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>

          {/* LOGIN LINK */}
          <div className="mt-7 border-t border-white/[0.07] pt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#d5b46a] transition hover:text-[#f0d89e]"
              >
                Sign In
              </Link>
            </p>
          </div>

        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          Secure registration · Salon Owner Portal
        </p>

      </div>
    </div>
  );
};

export default Register;
