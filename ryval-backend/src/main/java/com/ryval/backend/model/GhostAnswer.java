package com.ryval.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ghost_answers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GhostAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ghost_session_id", nullable = false)
    private GhostSession ghostSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String submittedAnswer;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isCorrect = false;

    private Long responseTimeMs;
}