package com.ryval.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BattleResponse {
    private Long id;
    private Long playerOneId;
    private String playerOneUsername;
    private Long playerTwoId;
    private String playerTwoUsername;
    private Long winnerId;
    private String status;
    private Instant createdAt;
    private Instant endedAt;
    private List<QuestionSummary> questions;

    // "NORMAL" or "FORFEIT" once status is COMPLETED, otherwise null.
    private String endReason;

    // --- Fields personalized to whichever player is requesting this response ---
    // 0-based index of the question the requesting player is currently on.
    // If myFinished is true, this equals questions.size().
    private Integer myQuestionIndex;

    // Server-authoritative deadline for the requester's CURRENT question.
    // Null if the requester has finished or the battle isn't IN_PROGRESS.
    // Frontend renders a live countdown from this timestamp but must not
    // treat client-side expiry as authoritative - it calls /skip and lets
    // the backend confirm.
    private Instant myQuestionDeadline;

    private Boolean myFinished;
    private Boolean opponentFinished;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionSummary {
        private Long battleQuestionId;
        private Long questionId;
        private String prompt;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
        private Integer sequenceOrder;
        // Deliberately no correctAnswer field here — never send the answer key
        // to the client before they've submitted, or it's trivially visible
        // in the browser network tab / React state.

        // Populated only if the requesting player has already answered this
        // question (including auto-skip timeouts) - lets the frontend
        // restore past-question feedback after a refresh without needing
        // localStorage.
        private String myAnswer;
        private Boolean myAnswerCorrect;
        private Boolean myAnswerWasTimeout;
    }
}