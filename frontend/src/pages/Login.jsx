
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Scissors, Eye, EyeOff } from "lucide-react";
import { useAppContext } from "../context/AppContext";

export default function Login() {
  const { login } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      });

      const destination = location.state?.from || "/";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-7 shadow-sm sm:p-9">
        <Link to="/" className="mb-7 flex items-center gap-2">
          <Scissors size={27} />
          <span className="text-xl font-bold">StyleHub</span>
        </Link>

        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="mt-2 text-sm text-gray-500">
          Log in to join the queue and track your salon visit.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Password
            </label>

            <div className="flex items-center rounded-lg border border-gray-300 pr-3 focus-within:border-black">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full rounded-lg px-4 py-3 outline-none"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black py-3 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-black underline">
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}
