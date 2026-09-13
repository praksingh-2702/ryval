package com.ryval.backend.repository;

import com.ryval.backend.model.Battle;
import com.ryval.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BattleRepository extends JpaRepository<Battle, Long> {

    @Query("SELECT b FROM Battle b WHERE b.playerOne = :user OR b.playerTwo = :user ORDER BY b.createdAt DESC")
    List<Battle> findAllForUser(@Param("user") User user);

    List<Battle> findByStatus(Battle.Status status);
}