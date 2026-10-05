import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import Panel from "../components/ui/Panel";
import Wordmark from "../components/Wordmark";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(username, email, password);
      // Every account gets a starter sigil from the server; this screen
      // lets the player make it their own right away.
      navigate("/customize", { state: { welcome: true } });
    } catch (err) {
      setError(
        err.response?.data?.error ||
          Object.values(err.response?.data || {})[0] ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ice px-6 py-12 text-ink">
      <Wordmark to="/" className="mb-8" />

      <Panel className="w-full max-w-md p-8">
        <h1 className="font-display text-5xl font-extrabold leading-none">Make your account</h1>
        <p className="mt-3 text-soft">Everyone starts at 1200 rating. Next up, you build your sigil.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Field
            label="Username"
            type="text"
            required
            minLength={3}
            maxLength={20}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="yourname"
          />
          <Field
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />

          {error && (
            <p className="rounded-lg border-2 border-ink bg-coral/25 px-4 py-3 font-medium">{error}</p>
          )}

          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? "Creating account" : "Create account"}
          </Button>
        </form>
      </Panel>

      <p className="mt-8 text-soft">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-ink underline decoration-2 underline-offset-4 hover:bg-lemon">
          Log in
        </Link>
      </p>
    </div>
  );
}
