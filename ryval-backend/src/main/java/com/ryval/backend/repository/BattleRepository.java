package com.ryval.backend.repository;

import com.ryval.backend.model.Battle;
import com.ryval.backend.model.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BattleRepository extends JpaRepository<Battle, Long> {

    @Query("SELECT b FROM Battle b WHERE b.playerOne = :user OR b.playerTwo = :user ORDER BY b.createdAt DESC")
    List<Battle> findAllForUser(@Param("user") User user);

    List<Battle> findByStatus(Battle.Status status);

    @Query("SELECT b FROM Battle b WHERE (b.playerOne = :user OR b.playerTwo = :user) " +
           "AND b.status IN (com.ryval.backend.model.Battle.Status.PENDING, com.ryval.backend.model.Battle.Status.IN_PROGRESS) " +
           "ORDER BY b.createdAt DESC")
    List<Battle> findActiveBattlesForUser(@Param("user") User user);

    default Optional<Battle> findActiveBattleForUser(User user) {
        List<Battle> battles = findActiveBattlesForUser(user);
        return battles.isEmpty() ? Optional.empty() : Optional.of(battles.get(0));
    }

    // Pessimistic write lock — used in endBattle to prevent two simultaneous
    // /end calls from both passing the COMPLETED check and double-applying ratings.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Battle b WHERE b.id = :id")
    Optional<Battle> findByIdWithLock(@Param("id") Long id);
}