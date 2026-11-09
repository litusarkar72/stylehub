import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Scissors, Eye, EyeOff } from "lucide-react";
import { useAppContext } from "../context/AppContext";

export default function Register() {
  const { register } = useAppContext();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (
      !name ||
      !email ||
      !phone ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!/^\+?[0-9\s()-]{10,20}$/.test(phone)) {
      setError("Please enter a valid mobile number.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await register({
        name,
        email,
        phone,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      if (response?.success === false) {
        setError(response.message || "Registration failed.");
        return;
      }

      setMessage(response?.message || "Account created successfully!");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black";

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-7 shadow-sm sm:p-9">

        {/* Logo */}
        <Link to="/" className="mb-7 flex items-center gap-2">
          <Scissors size={27} />
          <span className="text-xl font-bold">StyleHub</span>
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">
          Create your account
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Sign up to join and track your salon queue.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">

          {/* Full name */}
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Full name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className={inputClass}
              maxLength={100}
              required
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={inputClass}
              required
              disabled={loading}
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Mobile Number
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter your mobile number"
              className={inputClass}
              maxLength={20}
              required
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className={`${inputClass} pr-12`}
                minLength={6}
                required
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Confirm password
            </label>

            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                className={`${inputClass} pr-12`}
                required
                disabled={loading}
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((previous) => !previous)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {/* Success message */}
          {message && (
            <p
              role="status"
              className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
            >
              {message}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-black underline underline-offset-4"
          >
            Log in
          </Link>
        </p>

        <p className="mt-5 text-center text-xs text-gray-400">
          By creating an account, you can join and track your salon queue.
        </p>
      </div>
    </main>
  );
}
