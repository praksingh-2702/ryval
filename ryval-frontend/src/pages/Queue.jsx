import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function Queue() {
  const [status, setStatus] = useState("joining"); // joining | waiting | error
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const intervalRef = useRef(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    let inFlight = false;

    async function attempt() {
      if (inFlight || stoppedRef.current) return;
      inFlight = true;
      try {
        const { data } = await api.post("/battles/queue/join");

        if (data.id) {
          // Matched! data is a full BattleResponse with questions included.
          stoppedRef.current = true;
          clearInterval(intervalRef.current);
          navigate(`/battle/${data.id}`, { state: { battle: data } });
          return;
        }

        // Still queued
        setStatus("waiting");
      } catch (err) {
        stoppedRef.current = true;
        clearInterval(intervalRef.current);
        setStatus("error");
        setErrorMsg(err.response?.data?.error || "Couldn't join the queue");
      } finally {
        inFlight = false;
      }
    }

    attempt(); // try immediately
    intervalRef.current = setInterval(attempt, 3000); // re-check every 3s for a match

    return () => clearInterval(intervalRef.current);
  }, [navigate]);

  async function cancelQueue() {
    stoppedRef.current = true;
    clearInterval(intervalRef.current);
    try {
      await api.post("/battles/queue/leave");
    } catch {
      // best-effort, ignore
    }
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen bg-ink text-paper flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        {status !== "error" ? (
          <>
            <p className="font-display text-2xl font-semibold mb-2">
              Finding an opponent…
            </p>
            <p className="text-sm text-muted mb-8">
              Matching you with someone at a similar rating.
            </p>
            <button
              onClick={cancelQueue}
              className="text-sm text-muted hover:text-coral transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <p className="font-display text-xl font-semibold mb-2 text-coral">
              {errorMsg}
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm text-muted hover:text-paper transition-colors mt-4"
            >
              Back to dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}