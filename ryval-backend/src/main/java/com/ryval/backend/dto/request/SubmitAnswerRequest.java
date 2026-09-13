package com.ryval.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitAnswerRequest {

    @NotNull
    private Long battleQuestionId;

    @NotBlank
    private String answer;

    @NotNull
    private Long responseTimeMs;
}