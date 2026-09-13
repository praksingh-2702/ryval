package com.ryval.backend.repository;

import com.ryval.backend.model.Battle;
import com.ryval.backend.model.BattleQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BattleQuestionRepository extends JpaRepository<BattleQuestion, Long> {
    List<BattleQuestion> findByBattleOrderBySequenceOrderAsc(Battle battle);
}