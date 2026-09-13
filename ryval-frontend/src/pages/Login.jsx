import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink text-paper flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <Link to="/" className="font-display text-xl font-bold block text-center mb-8">
          RYVAL
        </Link>

        <h1 className="font-display text-2xl font-semibold text-center mb-1">
          Welcome back
        </h1>
        <p className="text-sm text-muted text-center mb-8">
          Ready for another round?
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-muted block mb-1.5">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-ink-raised border border-ink-line rounded-lg px-4 py-2.5 text-sm outline-none focus:border-violet transition-colors"
              placeholder="yourname"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ink-raised border border-ink-line rounded-lg px-4 py-2.5 text-sm outline-none focus:border-violet transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-coral bg-coral/10 border border-coral/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet hover:bg-violet-dim disabled:opacity-50 transition-colors text-white font-semibold py-2.5 rounded-lg text-sm mt-2"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-sm text-muted text-center mt-6">
          New to Ryval?{" "}
          <Link to="/register" className="text-paper hover:text-violet transition-colors font-medium">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
