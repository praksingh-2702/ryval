package com.ryval.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "ghost_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GhostSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ghost_battle_id", nullable = false)
    private Battle ghostBattle;

    @Column(updatable = false)
    private Instant startedAt;

    private Instant completedAt;

    @PrePersist
    protected void onCreate() {
        this.startedAt = Instant.now();
    }
}