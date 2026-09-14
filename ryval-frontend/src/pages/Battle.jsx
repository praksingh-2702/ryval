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
  const [selectedOption, setSelectedOption] = useState(null); // "A" | "B" | "C" | "D" | null
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null); // { isCorrect } or null
  const [startedAt, setStartedAt] = useState(Date.now());
  const [result, setResult] = useState(null); // final BattleResponse after /end

  useEffect(() => {
    if (!battle) {
      navigate("/dashboard", { replace: true });
    }
  }, [battle, navigate]);

  if (!battle) return null;

  const questions = battle.questions; // [{battleQuestionId, questionId, prompt, optionA..D, sequenceOrder}]
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const opponentUsername =
    battle.playerOneUsername === user?.username
      ? battle.playerTwoUsername
      : battle.playerOneUsername;

  const options = [
    { key: "A", text: currentQuestion.optionA },
    { key: "B", text: currentQuestion.optionB },
    { key: "C", text: currentQuestion.optionC },
    { key: "D", text: currentQuestion.optionD },
  ];

  async function handleSelect(optionKey) {
    if (submitting || lastResult !== null) return;
    setSelectedOption(optionKey);
    setSubmitting(true);
    try {
      const responseTimeMs = Date.now() - startedAt;
      const { data } = await api.post(`/battles/${battle.id}/answer`, {
        battleQuestionId: currentQuestion.battleQuestionId,
        answer: optionKey,
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
    setSelectedOption(null);
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

        <div className="space-y-3">
          {options.map((opt) => {
            const isSelected = selectedOption === opt.key;
            const showFeedback = lastResult !== null && isSelected;

            return (
              <button
                key={opt.key}
                onClick={() => handleSelect(opt.key)}
                disabled={submitting || lastResult !== null}
                className={`w-full text-left border rounded-lg px-4 py-3 text-sm transition-colors disabled:cursor-not-allowed
                  ${
                    showFeedback && lastResult.isCorrect
                      ? "border-gold bg-gold/10 text-gold"
                      : showFeedback && !lastResult.isCorrect
                      ? "border-coral bg-coral/10 text-coral"
                      : "border-ink-line bg-ink-raised hover:border-violet"
                  }`}
              >
                <span className="font-semibold mr-2">{opt.key}.</span>
                {opt.text}
              </button>
            );
          })}
        </div>

        {lastResult !== null && (
          <div className="mt-6">
            <p
              className={`text-sm font-medium mb-4 ${
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