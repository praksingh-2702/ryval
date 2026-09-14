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
    }
}