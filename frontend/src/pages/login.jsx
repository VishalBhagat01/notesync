import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import ThemeToggle from "../components/ThemeToggle";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(formData);
      localStorage.setItem("access_token", data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--bg-canvas)] px-6 transition-colors duration-200 desk-dots">
      {/* Theme Toggle in top-right */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 shadow-xl transition-all duration-200">
        {/* Brand Header */}
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff6600] text-white shadow-md shadow-orange-500/20">
            {/* NoteSync Notebook Emblem */}
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            NoteSync
          </h1>

          <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
            Your collaborative real-time digital notebook
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Email address
            </label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[#ff6600] focus:ring-2 focus:ring-[#ff6600]/20"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-500">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#ff6600] hover:bg-[#ff7a1a] py-2.5 text-sm font-semibold text-white transition-all duration-150 shadow-sm shadow-orange-950/20 hover:shadow-orange-500/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-5 text-center text-xs text-[var(--text-secondary)]">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="font-medium text-[#ff6600] transition hover:text-[#ff7a1a]"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;