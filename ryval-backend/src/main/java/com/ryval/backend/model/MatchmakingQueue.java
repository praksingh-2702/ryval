package com.ryval.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "matchmaking_queue")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchmakingQueue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private Integer ratingAtQueueTime;

    @Column(updatable = false)
    private Instant queuedAt;

    @PrePersist
    protected void onCreate() {
        // BUG FIX: previously unconditional, which meant any caller trying
        // to explicitly set queuedAt before save() (e.g. to preserve a
        // re-joining player's original wait time for matchmaking range
        // widening) would have it silently clobbered back to Instant.now()
        // right here. Only default it if it hasn't already been set.
        if (this.queuedAt == null) {
            this.queuedAt = Instant.now();
        }
    }
}