package com.ryval.backend.repository;

import com.ryval.backend.model.BattleAnswer;
import com.ryval.backend.model.BattleQuestion;
import com.ryval.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BattleAnswerRepository extends JpaRepository<BattleAnswer, Long> {

    List<BattleAnswer> findByBattleQuestion(BattleQuestion battleQuestion);

    // Used to check whether a given player has already answered (or been
    // auto-skipped on) a specific question - keeps submitAnswer/skip
    // idempotent against retries and out-of-order timer/skip races.
    Optional<BattleAnswer> findByBattleQuestionAndUser(BattleQuestion battleQuestion, User user);
}