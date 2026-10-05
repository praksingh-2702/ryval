import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../lib/api";
import { useProfile } from "../lib/queries";
import Avatar from "../components/avatar/Avatar";
import Button from "../components/ui/Button";

export default function Queue() {
  const [status, setStatus] = useState("joining"); // joining | waiting | error
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const intervalRef = useRef(null);
  const stoppedRef = useRef(false);
  const { data: profile } = useProfile();

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
    <div className="flex min-h-screen items-center justify-center bg-ice px-6 text-ink">
      <div className="max-w-md text-center">
        {status !== "error" ? (
          <>
            <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 rounded-full border-2 border-ink"
                animate={{ scale: [0.7, 1.15], opacity: [0.5, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Avatar avatar={profile?.avatar} size={128} shadow />
              </motion.div>
            </div>

            <h1 className="mt-6 font-display text-6xl font-black leading-none">Finding an opponent</h1>
            <p className="mt-3 text-lg text-soft">Matching you with someone close to your rating.</p>
            <Button variant="plain" className="mt-10" onClick={cancelQueue}>
              Cancel search
            </Button>
          </>
        ) : (
          <>
            <h1 className="font-display text-5xl font-black leading-none">{errorMsg}</h1>
            <Button variant="plain" className="mt-8" onClick={() => navigate("/dashboard")}>
              Back to dashboard
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
