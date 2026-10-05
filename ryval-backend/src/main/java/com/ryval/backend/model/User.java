package com.ryval.backend.model;

import com.ryval.backend.config.AvatarCatalog;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private String passwordHash;

    @Builder.Default
    private Integer rating = 1200;

    @Builder.Default
    private Integer wins = 0;

    @Builder.Default
    private Integer losses = 0;

    // Counted so wins + losses + draws always adds up to games played.
    // Shown on the dashboard only, never on the versus screen.
    // @ColumnDefault lets Hibernate add this to a table that already has rows.
    @Column(nullable = false)
    @ColumnDefault("0")
    @Builder.Default
    private Integer draws = 0;

    // Sigil (avatar). Never null: every column is NOT NULL with a database
    // default, and new accounts get a random sigil at registration.
    @Column(name = "avatar_shape", nullable = false, length = 24)
    @ColumnDefault("'round'")
    @Builder.Default
    private String avatarShape = AvatarCatalog.DEFAULT_SHAPE;

    @Column(name = "avatar_eyes", nullable = false, length = 24)
    @ColumnDefault("'dot'")
    @Builder.Default
    private String avatarEyes = AvatarCatalog.DEFAULT_EYES;

    @Column(name = "avatar_mark", nullable = false, length = 24)
    @ColumnDefault("'smile'")
    @Builder.Default
    private String avatarMark = AvatarCatalog.DEFAULT_MARK;

    @Column(name = "avatar_color", nullable = false, length = 7)
    @ColumnDefault("'#2D4BFF'")
    @Builder.Default
    private String avatarColor = AvatarCatalog.DEFAULT_COLOR;

    @Column(updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}