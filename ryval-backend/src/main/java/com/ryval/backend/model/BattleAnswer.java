package com.ryval.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "battle_answers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BattleAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "battle_question_id", nullable = false)
    private BattleQuestion battleQuestion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String submittedAnswer;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isCorrect = false;

    private Long responseTimeMs;

    @Column(updatable = false)
    private Instant submittedAt;

    @PrePersist
    protected void onCreate() {
        this.submittedAt = Instant.now();
    }
}