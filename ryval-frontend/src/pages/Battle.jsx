import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const POLL_INTERVAL_MS = 2000;
const TICK_MS = 250;
const QUESTION_SECONDS = 10;

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

  useEffect(() => {
    if (data) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: fetched } = await api.get(`/battles/${battleId}`);
        if (!cancelled) {
          setData(fetched);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoadError(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [battleId, data]);

  useEffect(() => {
    if (!data || data.status === "COMPLETED") return;
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const { data: fresh } = await api.get(`/battles/${battleId}`);
        if (cancelled) return;
        setData((prev) => {
          if (prev && fresh.myQuestionIndex !== prev.myQuestionIndex) {
            setSelectedOption(null);
            startedAtRef.current = Date.now();
            skippedIndexRef.current = null;
          }
          return fresh;
        });
      } catch {
        // transient — keep polling
      }
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [battleId, data?.status]);

  useEffect(() => {
    if (!data || data.myFinished || data.status === "COMPLETED") return;
    const tick = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(tick);
  }, [data?.myFinished, data?.status]);

  const deadlineMs = data?.myQuestionDeadline ? new Date(data.myQuestionDeadline).getTime() : null;
  const remainingMs = deadlineMs !== null ? Math.max(0, deadlineMs - now) : null;

  useEffect(() => {
    if (remainingMs === null || remainingMs > 0) return;
    if (!data || data.myFinished || data.status === "COMPLETED") return;
    if (submitting) return;
    if (skippedIndexRef.current === data.myQuestionIndex) return;
    skippedIndexRef.current = data.myQuestionIndex;

    const currentQuestion = data.questions[data.myQuestionIndex];
    const pendingSelection = selectedOption;

    (async () => {
      try {
        let fresh;
        if (pendingSelection) {
          const responseTimeMs = Date.now() - startedAtRef.current;
          const res = await api.post(`/battles/${battleId}/answer`, {
            battleQuestionId: currentQuestion.battleQuestionId,
            answer: pendingSelection,
            responseTimeMs,
          });
          fresh = res.data;
          const answered = fresh.questions.find(
            (q) => q.battleQuestionId === currentQuestion.battleQuestionId
          );
          setFeedback({ isCorrect: !!answered?.myAnswerCorrect, autoSubmitted: true });
        } else {
          const res = await api.post(`/battles/${battleId}/skip`);
          fresh = res.data;
          setFeedback({ isCorrect: false, timeout: true });
        }
        setSelectedOption(null);
        startedAtRef.current = Date.now();
        setData(fresh);
      } catch {
        skippedIndexRef.current = null;
      }
    })();
  }, [remainingMs, battleId, data, submitting, selectedOption]);

  async function handleSubmit() {
    if (submitting || !selectedOption || !data) return;
    setSubmitting(true);
    const currentQuestion = data.questions[data.myQuestionIndex];
    try {
      const responseTimeMs = Date.now() - startedAtRef.current;
      const { data: fresh } = await api.post(`/battles/${battleId}/answer`, {
        battleQuestionId: currentQuestion.battleQuestionId,
        answer: selectedOption,
        responseTimeMs,
      });
      const answered = fresh.questions.find(
        (q) => q.battleQuestionId === currentQuestion.battleQuestionId
      );
      setFeedback({ isCorrect: !!answered?.myAnswerCorrect });
      setSelectedOption(null);
      startedAtRef.current = Date.now();
      setData(fresh);
    } catch {
      setFeedback({ isCorrect: false, error: true });
    } finally {
      setSubmitting(false);
    }
  }

  async function finishBattle() {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setSubmitting(true);
    try {
      const { data: fresh } = await api.post(`/battles/${battleId}/end`);
      setData(fresh);
    } catch {
      navigate("/dashboard");
    } finally {
      setSubmitting(false);
      finishingRef.current = false;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink text-paper flex items-center justify-center">
        <p className="text-sm text-muted">Loading battle…</p>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="min-h-screen bg-ink text-paper flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="font-display text-xl font-semibold mb-4">
            Couldn't load that battle.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-muted hover:text-paper transition-colors"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const opponentUsername =
    data.playerOneUsername === user?.username
      ? data.playerTwoUsername
      : data.playerOneUsername;

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
            {won && "+20 rating"}
            {!won && !draw && "-20 rating"}
            {draw && "No rating change"}
          </p>
          {forfeited && (
            <p className="text-sm text-muted mb-6">
              {won
                ? `${opponentUsername} didn't finish the battle.`
                : "You didn't finish in time."}
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
          <p className="font-display text-2xl font-semibold mb-2">
            Waiting for {opponentUsername}…
          </p>
          <p className="text-sm text-muted">
            You've finished all your questions. Results appear once your opponent
            is done.
          </p>
        </div>
      </div>
    );
  }

  const questions = data.questions;
  const currentIndex = data.myQuestionIndex;
  const currentQuestion = questions[currentIndex];
  const secondsLeft = remainingMs !== null ? Math.ceil(remainingMs / 1000) : null;

  if (feedback) {
    const justFinished = currentIndex >= questions.length;
    return (
      <div className="min-h-screen bg-ink text-paper flex items-center justify-center px-6">
        <div className="w-full max-w-lg text-center">
          <p
            className={`text-sm font-medium mb-6 ${
              feedback.isCorrect ? "text-gold" : "text-coral"
            }`}
          >
            {feedback.error
              ? "Couldn't submit that — moving on."
              : feedback.timeout
              ? "Time's up — question skipped."
              : feedback.autoSubmitted
              ? feedback.isCorrect
                ? "Time's up — your pick was correct!"
                : "Time's up — your pick wasn't correct."
              : feedback.isCorrect
              ? "Correct!"
              : "Not quite."}
          </p>
          <button
            onClick={() => {
              setFeedback(null);
              if (justFinished) finishBattle();
            }}
            disabled={submitting}
            className="bg-paper text-ink hover:bg-violet hover:text-white disabled:opacity-50 transition-colors font-semibold px-6 py-3 rounded-lg text-sm"
          >
            {submitting ? "…" : justFinished ? "Finish battle" : "Next question"}
          </button>
        </div>
      </div>
    );
  }

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
          <span>
            Question {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {secondsLeft !== null && (
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

        <p className="font-display text-2xl font-semibold mb-8">
          {currentQuestion?.prompt}
        </p>

        <div className="space-y-3">
          {options?.map((opt) => {
            const isSelected = selectedOption === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setSelectedOption(opt.key)}
                disabled={submitting}
                className={`w-full text-left border rounded-lg px-4 py-3 text-sm transition-colors disabled:cursor-not-allowed
                  ${
                    isSelected
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

        <button
          onClick={handleSubmit}
          disabled={submitting || !selectedOption}
          className="w-full mt-6 bg-paper text-ink hover:bg-violet hover:text-white disabled:opacity-40 transition-colors font-semibold py-3 rounded-lg text-sm"
        >
          {submitting ? "Submitting…" : "Submit answer"}
        </button>
      </div>
    </div>
  );
}