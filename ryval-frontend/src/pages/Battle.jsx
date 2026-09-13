import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Battle() {
  const { battleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [battle] = useState(location.state?.battle || null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null); // { isCorrect } or null
  const [startedAt, setStartedAt] = useState(Date.now());
  const [result, setResult] = useState(null); // final BattleResponse after /end

  useEffect(() => {
    // If someone lands here directly (refresh, back button) without battle
    // data in navigation state, we have no way to recover the question list
    // from the backend yet — send them back to the dashboard.
    if (!battle) {
      navigate("/dashboard", { replace: true });
    }
  }, [battle, navigate]);

  if (!battle) return null;

  const questions = battle.questions; // [{battleQuestionId, questionId, prompt, sequenceOrder}]
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const opponentUsername =
    battle.playerOneUsername === user?.username
      ? battle.playerTwoUsername
      : battle.playerOneUsername;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!answer.trim() || submitting) return;

    setSubmitting(true);
    try {
      const responseTimeMs = Date.now() - startedAt;
      const { data } = await api.post(`/battles/${battle.id}/answer`, {
        battleQuestionId: currentQuestion.battleQuestionId,
        answer: answer.trim(),
        responseTimeMs,
      });
      setLastResult({ isCorrect: data.isCorrect });
    } catch {
      setLastResult({ isCorrect: false, error: true });
    } finally {
      setSubmitting(false);
    }
  }

  function nextQuestion() {
    setAnswer("");
    setLastResult(null);
    setStartedAt(Date.now());
    setCurrentIndex((i) => i + 1);
  }

  async function finishBattle() {
    setSubmitting(true);
    try {
      const { data } = await api.post(`/battles/${battle.id}/end`);
      setResult(data);
    } catch {
      // If ending fails (e.g. opponent hasn't answered all questions yet on
      // the backend's side), just drop back to the dashboard — this is a
      // known rough edge until we add a "waiting for opponent" step.
      navigate("/dashboard");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const won = result.winnerId && user && result.winnerId === Number(user.userId);
    const draw = !result.winnerId;

    return (
      <div className="min-h-screen bg-ink text-paper flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="font-display text-4xl font-bold mb-2">
            {draw ? "Draw" : won ? "You won" : "You lost"}
          </p>
          <p className="text-sm text-muted mb-8">
            {won && "+20 rating"}
            {!won && !draw && "-20 rating"}
            {draw && "No rating change"}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-violet hover:bg-violet-dim transition-colors text-white font-semibold px-6 py-3 rounded-full text-sm"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-paper flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-8 text-sm text-muted">
          <span>vs {opponentUsername}</span>
          <span>
            Question {currentIndex + 1} / {questions.length}
          </span>
        </div>

        <p className="font-display text-2xl font-semibold mb-8">
          {currentQuestion.prompt}
        </p>

        {lastResult === null ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              autoFocus
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full bg-ink-raised border border-ink-line rounded-lg px-4 py-3 text-sm outline-none focus:border-violet transition-colors"
              placeholder="Your answer"
            />
            <button
              type="submit"
              disabled={submitting || !answer.trim()}
              className="w-full bg-violet hover:bg-violet-dim disabled:opacity-50 transition-colors text-white font-semibold py-3 rounded-lg text-sm"
            >
              {submitting ? "Submitting…" : "Submit answer"}
            </button>
          </form>
        ) : (
          <div>
            <p
              className={`text-sm font-medium mb-6 ${
                lastResult.isCorrect ? "text-gold" : "text-coral"
              }`}
            >
              {lastResult.error
                ? "Couldn't submit that — try the next question."
                : lastResult.isCorrect
                ? "Correct!"
                : "Not quite."}
            </p>
            <button
              onClick={isLastQuestion ? finishBattle : nextQuestion}
              disabled={submitting}
              className="w-full bg-paper text-ink hover:bg-violet hover:text-white disabled:opacity-50 transition-colors font-semibold py-3 rounded-lg text-sm"
            >
              {submitting
                ? "Finishing…"
                : isLastQuestion
                ? "Finish battle"
                : "Next question"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}