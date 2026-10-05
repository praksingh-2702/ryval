import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import Panel from "../components/ui/Panel";
import Wordmark from "../components/Wordmark";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-ice px-6 py-12 text-ink">
      <Wordmark to="/" className="mb-8" />

      <Panel className="w-full max-w-md p-8">
        <h1 className="font-display text-5xl font-extrabold leading-none">Back for another round</h1>
        <p className="mt-3 text-soft">Log in and jump straight into the queue.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Field
            label="Username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="yourname"
          />
          <Field
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
          />

          {error && (
            <p className="rounded-lg border-2 border-ink bg-coral/25 px-4 py-3 font-medium">{error}</p>
          )}

          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? "Logging in" : "Log in"}
          </Button>
        </form>
      </Panel>

      <p className="mt-8 text-soft">
        New to Ryval?{" "}
        <Link to="/register" className="font-semibold text-ink underline decoration-2 underline-offset-4 hover:bg-lemon">
          Create an account
        </Link>
      </p>
    </div>
  );
}
