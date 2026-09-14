package com.ryval.backend.repository;

import com.ryval.backend.model.Battle;
import com.ryval.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BattleRepository extends JpaRepository<Battle, Long> {

    @Query("SELECT b FROM Battle b WHERE b.playerOne = :user OR b.playerTwo = :user ORDER BY b.createdAt DESC")
    List<Battle> findAllForUser(@Param("user") User user);

    List<Battle> findByStatus(Battle.Status status);

    // Used by matchmaking polling: lets whichever player's request DIDN'T create
    // the Battle row still discover it on their next poll, instead of being
    // silently re-queued forever. ORDER BY + LIMIT 1 in case somehow more than
    // one live battle exists for a user (shouldn't happen, but keeps this safe).
    @Query("SELECT b FROM Battle b WHERE (b.playerOne = :user OR b.playerTwo = :user) " +
           "AND b.status IN (com.ryval.backend.model.Battle.Status.PENDING, com.ryval.backend.model.Battle.Status.IN_PROGRESS) " +
           "ORDER BY b.createdAt DESC")
    List<Battle> findActiveBattlesForUser(@Param("user") User user);

    default Optional<Battle> findActiveBattleForUser(User user) {
        List<Battle> battles = findActiveBattlesForUser(user);
        return battles.isEmpty() ? Optional.empty() : Optional.of(battles.get(0));
    }
}