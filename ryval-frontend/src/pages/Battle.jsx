import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const POLL_INTERVAL_MS = 2000;
const TICK_MS = 250;
const QUESTION_SECONDS = 10;
const FEEDBACK_DURATION_MS = 1500;

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
  const [feedback, setFeedback] = useState(null); // { isCorrect, label } shown inline
  const [now, setNow] = useState(Date.now());

  const skippedIndexRef = useRef(null);
  const startedAtRef = useRef(Date.now());
  const finishingRef = useRef(false);
  const feedbackTimerRef = useRef(null);

  // Initial load if no state passed
  useEffect(() => {
    if (data) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: fetched } = await api.get(`/battles/${battleId}`);
        if (!cancelled) { setData(fetched); setLoading(false); }
      } catch {
        if (!cancelled) { setLoadError(true); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [battleId, data]);

  // Poll for opponent state and battle completion
  useEffect(() => {
    if (!data || data.status === "COMPLETED") return;
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const { data: fresh } = await api.get(`/battles/${battleId}`);
        if (cancelled) return;
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

  // Countdown tick
  useEffect(() => {
    if (!data || data.myFinished || data.status === "COMPLETED" || feedback) return;
    const tick = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(tick);
  }, [data?.myFinished, data?.status, feedback]);

  const deadlineMs = data?.myQuestionDeadline ? new Date(data.myQuestionDeadline).getTime() : null;
  const remainingMs = deadlineMs !== null ? Math.max(0, deadlineMs - now) : null;

  // Clear feedback timer on unmount
  useEffect(() => () => { if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current); }, []);

  function showFeedbackThenAdvance(freshData, label, isCorrect) {
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
          setData(ended);
        } catch {
          navigate("/dashboard");
        } finally {
          finishingRef.current = false;
        }
      }
    }, FEEDBACK_DURATION_MS);
  }

  // Auto-submit or skip on timer expiry
  useEffect(() => {
    if (remainingMs === null || remainingMs > 0) return;
    if (!data || data.myFinished || data.status === "COMPLETED") return;
    if (submitting || feedback) return;
    if (skippedIndexRef.current === data.myQuestionIndex) return;
    skippedIndexRef.current = data.myQuestionIndex;

    const currentQuestion = data.questions[data.myQuestionIndex];
    const pendingSelection = selectedOption;

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
          showFeedbackThenAdvance(fresh, "Time's up — question skipped.", false);
        }
      } catch {
        // Genuinely failed to record - allow retry on the next tick rather
        // than faking progress. skippedIndexRef reset lets this fire again.
        skippedIndexRef.current = null;
      }
    })();
  }, [remainingMs, battleId, data, submitting, feedback, selectedOption]);

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
      // BUG FIX: this used to call showFeedbackThenAdvance(data, ...) -
      // reusing the stale pre-submit `data`, whose myQuestionIndex never
      // changes. That made the UI re-render the exact same question every
      // time, forever, whenever the POST failed for any reason (including
      // the "Not your current question" error caused by the startBattle
      // race - now fixed separately). Instead, re-sync with the server's
      // actual state and only fabricate feedback if the answer genuinely
      // did land server-side (e.g. the response was lost after the write
      // succeeded).
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
          // Answer wasn't recorded. Resync (the battle may have changed
          // underneath us) and let the player try again.
          setData(fresh);
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
  const secondsLeft = remainingMs !== null ? Math.ceil(remainingMs / 1000) : null;

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

        {!feedback && secondsLeft !== null && (
          <div className="mb-6">
            <div className="h-1 w-full bg-ink-raised rounded-full overflow-hidden">
              <div
                className="h-full bg-violet transition-all duration-200 ease-linear"
                style={{ width: `${Math.max(0, (remainingMs / (QUESTION_SECONDS * 1000)) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted mt-1 text-right">{secondsLeft}s</p>
          </div>
        )}

        <p className="font-display text-2xl font-semibold mb-8">{currentQuestion?.prompt}</p>

        <div className="space-y-3">
          {options?.map((opt) => {
            const isSelected = selectedOption === opt.key;
            const isAnswered = feedback !== null;
            const wasMyAnswer = isAnswered && selectedOption === opt.key;

            return (
              <button
                key={opt.key}
                onClick={() => !feedback && setSelectedOption(opt.key)}
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

        {feedback ? (
          <p className={`mt-6 text-sm font-medium text-center ${feedback.isCorrect ? "text-green-400" : "text-coral"}`}>
            {feedback.label}
          </p>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedOption}
            className="w-full mt-6 bg-paper text-ink hover:bg-violet hover:text-white disabled:opacity-40 transition-colors font-semibold py-3 rounded-lg text-sm"
          >
            {submitting ? "Submitting…" : "Submit answer"}
          </button>
        )}
      </div>
    </div>
  );
}