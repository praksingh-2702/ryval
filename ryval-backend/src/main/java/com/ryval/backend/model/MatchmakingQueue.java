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
        this.queuedAt = Instant.now();
    }
}