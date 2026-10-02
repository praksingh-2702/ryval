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

    private String endReason;

    private Integer myQuestionIndex;
    private Instant myQuestionDeadline;

    private Boolean myFinished;
    private Boolean opponentFinished;

    // BUG FIX: lets the frontend compute (serverTime - Date.now()) as a
    // clock offset, so countdowns and skip-timing are anchored to the
    // server's clock instead of trusting the player's own device clock.
    // Without this, a player whose system clock runs even a few seconds
    // fast perceives the deadline as having passed early, fires /skip
    // prematurely, gets a server-side no-op (since the real deadline
    // hasn't passed), and can loop on that indefinitely since the question
    // never actually advances.
    private Instant serverTime;

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

        private String myAnswer;
        private Boolean myAnswerCorrect;
        private Boolean myAnswerWasTimeout;
    }
}