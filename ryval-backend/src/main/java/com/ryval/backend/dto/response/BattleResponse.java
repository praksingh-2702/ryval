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
        private Integer sequenceOrder;
    }
}