import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const POLL_INTERVAL_MS = 2000;
const TICK_MS = 250;
const QUESTION_SECONDS = 10;
const FEEDBACK_DURATION_MS = 1500;
const INPUT_LOCK_MS = 300;

function CircularTimer({ remainingMs, totalMs }) {
  const size = 72;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0;
  const offset = circumference * (1 - pct);
  const seconds = Math.ceil(remainingMs / 1000);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className="stroke-ink-raised"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-violet transition-[stroke-dashoffset] duration-200 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-xl font-semibold tabular-nums">{seconds}</span>
      </div>
    </div>
  );
}

export default function Battle() {
  const { battleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(!location.state?.battle);
  const [loadError, setLoadError] = useState(false);
  const [data, setData] = useState(location.state?.battle || null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [now, setNow] = useState(Date.now());

  const skippedIndexRef = useRef(null);
  const startedAtRef = useRef(Date.now());
  const finishingRef = useRef(false);
  const feedbackTimerRef = useRef(null);
  const questionMountedAtRef = useRef(Date.now());

  // BUG FIX: clock offset between this device and the server, derived from
  // serverTime on every response. correctedNow() below is used everywhere
  // we'd otherwise call Date.now() for deadline comparisons, so a device
  // with a fast or slow system clock no longer perceives the countdown
  // wrong or fires /skip before or after the server's real deadline.
  const clockOffsetRef = useRef(0);

  function applyServerData(fresh) {
    if (fresh?.serverTime) {
      clockOffsetRef.current = new Date(fresh.serverTime).getTime() - Date.now();
    }
    setData(fresh);
    return fresh;
  }

  function correctedNow() {
    return Date.now() + clockOffsetRef.current;
  }

  useEffect(() => {
    if (data) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: fetched } = await api.get(`/battles/${battleId}`);
        if (!cancelled) { applyServerData(fetched); setLoading(false); }
      } catch {
        if (!cancelled) { setLoadError(true); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [battleId, data]);

  useEffect(() => {
    if (!data || data.status === "COMPLETED") return;
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const { data: fresh } = await api.get(`/battles/${battleId}`);
        if (cancelled) return;
        if (fresh?.serverTime) {
          clockOffsetRef.current = new Date(fresh.serverTime).getTime() - Date.now();
        }
        setData((prev) => {
          if (prev && fresh.myQuestionIndex !== prev.myQuestionIndex) {
            startedAtRef.current = Date.now();
            skippedIndexRef.current = null;
          }
          return fresh;
        });
      } catch { /* transient */ }
    }, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [battleId, data?.status]);

  useEffect(() => {
    if (!data || data.myFinished || data.status === "COMPLETED" || feedback) return;
    const tick = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(tick);
  }, [data?.myFinished, data?.status, feedback]);

  useEffect(() => {
    if (!feedback) {
      questionMountedAtRef.current = Date.now();
    }
  }, [data?.myQuestionIndex, feedback]);

  const deadlineMs = data?.myQuestionDeadline ? new Date(data.myQuestionDeadline).getTime() : null;
  // BUG FIX: use correctedNow() (server-offset-adjusted) instead of raw `now`
  // state for the actual remaining-time calculation.
  const remainingMs = deadlineMs !== null ? Math.max(0, deadlineMs - (now + clockOffsetRef.current)) : null;

  useEffect(() => () => { if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current); }, []);

  function showFeedbackThenAdvance(freshData, label, isCorrect) {
    if (freshData?.serverTime) {
      clockOffsetRef.current = new Date(freshData.serverTime).getTime() - Date.now();
    }
    setFeedback({ label, isCorrect });
    setData(freshData);
    setSelectedOption(null);

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(async () => {
      setFeedback(null);
      startedAtRef.current = Date.now();

      const justFinished = freshData.myQuestionIndex >= freshData.questions.length;
      if (justFinished) {
        if (finishingRef.current) return;
        finishingRef.current = true;
        try {
          const { data: ended } = await api.post(`/battles/${battleId}/end`);
          applyServerData(ended);
        } catch {
          navigate("/dashboard");
        } finally {
          finishingRef.current = false;
        }
      }
    }, FEEDBACK_DURATION_MS);
  }

  useEffect(() => {
    if (remainingMs === null || remainingMs > 0) return;
    if (!data || data.myFinished || data.status === "COMPLETED") return;
    if (submitting || feedback) return;
    if (skippedIndexRef.current === data.myQuestionIndex) return;
    skippedIndexRef.current = data.myQuestionIndex;

    const currentQuestion = data.questions[data.myQuestionIndex];
    const pendingSelection = selectedOption;
    const indexBeforeCall = data.myQuestionIndex;

    (async () => {
      try {
        if (pendingSelection) {
          const responseTimeMs = Date.now() - startedAtRef.current;
          const { data: fresh } = await api.post(`/battles/${battleId}/answer`, {
            battleQuestionId: currentQuestion.battleQuestionId,
            answer: pendingSelection,
            responseTimeMs,
          });
          const answered = fresh.questions.find(q => q.battleQuestionId === currentQuestion.battleQuestionId);
          const correct = !!answered?.myAnswerCorrect;
          showFeedbackThenAdvance(fresh, correct ? "Time's up — your pick was correct!" : "Time's up — not correct.", correct);
        } else {
          const { data: fresh } = await api.post(`/battles/${battleId}/skip`);

          // BUG FIX: the backend silently no-ops /skip if, from the SERVER's
          // clock, the deadline hasn't actually passed yet — which can
          // happen if this client's deadline math is still off by a little
          // (clock drift, latency, etc). Previously we'd show a fake
          // "skipped" feedback and loop forever since the index never
          // actually changed. Now we detect the no-op (index unchanged),
          // silently resync clock + state, and let the (now better-synced)
          // countdown naturally re-trigger skip once the real deadline
          // passes — instead of faking progress or spinning indefinitely.
          if (fresh.myQuestionIndex === indexBeforeCall) {
            applyServerData(fresh);
            skippedIndexRef.current = null;
            return;
          }

          showFeedbackThenAdvance(fresh, "Time's up — question skipped.", false);
        }
      } catch {
        skippedIndexRef.current = null;
      }
    })();
  }, [remainingMs, battleId, data, submitting, feedback, selectedOption]);

  function handleOptionClick(key) {
    if (feedback) return;
    if (Date.now() - questionMountedAtRef.current < INPUT_LOCK_MS) return;
    setSelectedOption(key);
  }

  async function handleSubmit() {
    if (submitting || !selectedOption || !data || feedback) return;
    setSubmitting(true);
    const currentQuestion = data.questions[data.myQuestionIndex];
    try {
      const responseTimeMs = Date.now() - startedAtRef.current;
      const { data: fresh } = await api.post(`/battles/${battleId}/answer`, {
        battleQuestionId: currentQuestion.battleQuestionId,
        answer: selectedOption,
        responseTimeMs,
      });
      const answered = fresh.questions.find(q => q.battleQuestionId === currentQuestion.battleQuestionId);
      const correct = !!answered?.myAnswerCorrect;
      showFeedbackThenAdvance(fresh, correct ? "Correct!" : "Not quite.", correct);
    } catch {
      try {
        const { data: fresh } = await api.get(`/battles/${battleId}`);
        const answered = fresh.questions.find(q => q.battleQuestionId === currentQuestion.battleQuestionId);
        if (answered?.myAnswer) {
          showFeedbackThenAdvance(
            fresh,
            answered.myAnswerCorrect ? "Correct!" : "Not quite.",
            !!answered.myAnswerCorrect
          );
        } else {
          applyServerData(fresh);
        }
      } catch {
        // Backend unreachable — leave state as-is, the poll loop retries.
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-ink text-paper flex items-center justify-center">
      <p className="text-sm text-muted">Loading battle…</p>
    </div>
  );

  if (loadError || !data) return (
    <div className="min-h-screen bg-ink text-paper flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="font-display text-xl font-semibold mb-4">Couldn't load that battle.</p>
        <button onClick={() => navigate("/dashboard")} className="text-sm text-muted hover:text-paper transition-colors">
          Back to dashboard
        </button>
      </div>
    </div>
  );

  const opponentUsername = data.playerOneUsername === user?.username
    ? data.playerTwoUsername : data.playerOneUsername;

  if (data.status === "COMPLETED") {
    const won = data.winnerId && user && data.winnerId === Number(user.userId);
    const draw = !data.winnerId;
    const forfeited = data.endReason === "FORFEIT";
    return (
      <div className="min-h-screen bg-ink text-paper flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="font-display text-4xl font-bold mb-2">
            {draw ? "Draw" : won ? "You won" : "You lost"}
          </p>
          <p className="text-sm text-muted mb-2">
            {won ? "+20 rating" : draw ? "No rating change" : "-20 rating"}
          </p>
          {forfeited && (
            <p className="text-sm text-muted mb-6">
              {won ? `${opponentUsername} didn't finish in time.` : "You didn't finish in time."}
            </p>
          )}
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-violet hover:bg-violet-dim transition-colors text-white font-semibold px-6 py-3 rounded-full text-sm mt-4"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (data.myFinished && !data.opponentFinished) {
    return (
      <div className="min-h-screen bg-ink text-paper flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="font-display text-2xl font-semibold mb-2">Waiting for {opponentUsername}…</p>
          <p className="text-sm text-muted">Results appear once your opponent is done.</p>
        </div>
      </div>
    );
  }

  const questions = data.questions;
  const currentIndex = data.myQuestionIndex;

  if (currentIndex >= questions.length) {
    return (
      <div className="min-h-screen bg-ink text-paper flex items-center justify-center px-6">
        <p className="text-sm text-muted">Finishing up…</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  const options = currentQuestion && [
    { key: "A", text: currentQuestion.optionA },
    { key: "B", text: currentQuestion.optionB },
    { key: "C", text: currentQuestion.optionC },
    { key: "D", text: currentQuestion.optionD },
  ];

  return (
    <div className="min-h-screen bg-ink text-paper flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-4 text-sm text-muted">
          <span>vs {opponentUsername}</span>
          <span>Question {currentIndex + 1} / {questions.length}</span>
        </div>

        <div className="mb-6 h-20 flex justify-center">
          {!feedback && remainingMs !== null && (
            <CircularTimer remainingMs={remainingMs} totalMs={QUESTION_SECONDS * 1000} />
          )}
        </div>

        <p className="font-display text-2xl font-semibold mb-8">{currentQuestion?.prompt}</p>

        <div className="space-y-3">
          {options?.map((opt) => {
            const isSelected = selectedOption === opt.key;
            const isAnswered = feedback !== null;
            const wasMyAnswer = isAnswered && selectedOption === opt.key;

            return (
              <button
                key={opt.key}
                onClick={() => handleOptionClick(opt.key)}
                disabled={submitting || !!feedback}
                className={`w-full text-left border rounded-lg px-4 py-3 text-sm transition-colors disabled:cursor-not-allowed
                  ${isAnswered && wasMyAnswer
                    ? feedback.isCorrect
                      ? "border-green-500 bg-green-500/10 text-paper"
                      : "border-coral bg-coral/10 text-paper"
                    : isSelected
                      ? "border-violet bg-violet/10 text-paper"
                      : "border-ink-line bg-ink-raised hover:border-violet"
                  }`}
              >
                <span className="font-semibold mr-2">{opt.key}.</span>
                {opt.text}
              </button>
            );
          })}
        </div>

        <div className="mt-6 h-12 flex items-center justify-center">
          {feedback ? (
            <p className={`text-sm font-medium text-center ${feedback.isCorrect ? "text-green-400" : "text-coral"}`}>
              {feedback.label}
            </p>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedOption}
              className="w-full h-full bg-paper text-ink hover:bg-violet hover:text-white disabled:opacity-40 transition-colors font-semibold rounded-lg text-sm"
            >
              {submitting ? "Submitting…" : "Submit answer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}