package com.ryval.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "battles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Battle {

    public enum Status {
        PENDING, IN_PROGRESS, COMPLETED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_one_id", nullable = false)
    private User playerOne;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_two_id", nullable = false)
    private User playerTwo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_id")
    private User winner;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(nullable = false)
    @Builder.Default
    private boolean playerOneFinished = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean playerTwoFinished = false;

    @Column(nullable = false)
    @Builder.Default
    private int playerOneQuestionIndex = 0;

    @Column(nullable = false)
    @Builder.Default
    private int playerTwoQuestionIndex = 0;

    private Instant playerOneQuestionDeadline;
    private Instant playerTwoQuestionDeadline;

    private Instant playerOneLastSeenAt;
    private Instant playerTwoLastSeenAt;

    private String endReason;

    @Column(updatable = false)
    private Instant createdAt;

    private Instant endedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}