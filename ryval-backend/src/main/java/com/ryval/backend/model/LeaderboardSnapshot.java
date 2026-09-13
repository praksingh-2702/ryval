package com.ryval.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "leaderboard_snapshots")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaderboardSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Integer rank;

    @Column(nullable = false)
    private Integer rating;

    @Column(updatable = false)
    private Instant snapshotAt;

    @PrePersist
    protected void onCreate() {
        this.snapshotAt = Instant.now();
    }
}