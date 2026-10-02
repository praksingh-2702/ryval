package com.ryval.backend.service;

import com.ryval.backend.model.Battle;
import com.ryval.backend.model.BattleQuestion;
import com.ryval.backend.model.Question;
import com.ryval.backend.repository.BattleQuestionRepository;
import com.ryval.backend.repository.BattleRepository;
import com.ryval.backend.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BattleQuestionInitializerService {

    private static final int QUESTIONS_PER_BATTLE = 5;
    private static final long QUESTION_TIMEOUT_SECONDS = 10;

    private final BattleQuestionRepository battleQuestionRepository;
    private final QuestionRepository questionRepository;
    private final BattleRepository battleRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void tryCreateQuestions(Long battleId) {
        Battle battle = battleRepository.findById(battleId)
                .orElseThrow(() -> new RuntimeException("Battle not found: " + battleId));

        if (battle.getStatus() != Battle.Status.PENDING) {
            return;
        }

        List<Question> questions = questionRepository.findAll();
        Collections.shuffle(questions);
        List<Question> selected = questions.stream()
                .limit(QUESTIONS_PER_BATTLE)
                .collect(Collectors.toList());

        for (int i = 0; i < selected.size(); i++) {
            BattleQuestion bq = BattleQuestion.builder()
                    .battle(battle)
                    .question(selected.get(i))
                    .sequenceOrder(i + 1)
                    .build();
            battleQuestionRepository.saveAndFlush(bq);
        }

        Instant now = Instant.now();
        battle.setStatus(Battle.Status.IN_PROGRESS);
        battle.setPlayerOneQuestionIndex(0);
        battle.setPlayerTwoQuestionIndex(0);
        battle.setPlayerOneQuestionDeadline(now.plusSeconds(QUESTION_TIMEOUT_SECONDS));
        battle.setPlayerTwoQuestionDeadline(now.plusSeconds(QUESTION_TIMEOUT_SECONDS));
        battle.setPlayerOneLastSeenAt(now);
        battle.setPlayerTwoLastSeenAt(now);
        battleRepository.save(battle);
    }
}