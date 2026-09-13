package com.ryval.backend.service;

import com.ryval.backend.dto.request.SubmitAnswerRequest;
import com.ryval.backend.dto.response.BattleResponse;
import com.ryval.backend.model.*;
import com.ryval.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BattleService {

    private static final int QUESTIONS_PER_BATTLE = 5;

    private final BattleRepository battleRepository;
    private final BattleQuestionRepository battleQuestionRepository;
    private final BattleAnswerRepository battleAnswerRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;

    @Transactional
    public BattleResponse startBattle(Long battleId) {
        Battle battle = getBattle(battleId);

        List<Question> questions = questionRepository.findAll();
        java.util.Collections.shuffle(questions);
        List<Question> selected = questions.stream().limit(QUESTIONS_PER_BATTLE).collect(Collectors.toList());

        for (int i = 0; i < selected.size(); i++) {
            BattleQuestion bq = BattleQuestion.builder()
                    .battle(battle)
                    .question(selected.get(i))
                    .sequenceOrder(i + 1)
                    .build();
            battleQuestionRepository.save(bq);
        }

        battle.setStatus(Battle.Status.IN_PROGRESS);
        battleRepository.save(battle);

        return toResponse(battle);
    }

    @Transactional
    public BattleAnswer submitAnswer(String username, SubmitAnswerRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        BattleQuestion battleQuestion = battleQuestionRepository.findById(request.getBattleQuestionId())
                .orElseThrow(() -> new RuntimeException("Battle question not found"));

        boolean isCorrect = battleQuestion.getQuestion().getCorrectAnswer()
                .trim().equalsIgnoreCase(request.getAnswer().trim());

        BattleAnswer answer = BattleAnswer.builder()
                .battleQuestion(battleQuestion)
                .user(user)
                .submittedAnswer(request.getAnswer())
                .isCorrect(isCorrect)
                .responseTimeMs(request.getResponseTimeMs())
                .build();

        return battleAnswerRepository.save(answer);
    }

    @Transactional
    public BattleResponse endBattle(Long battleId) {
        Battle battle = getBattle(battleId);

        List<BattleQuestion> battleQuestions = battleQuestionRepository.findByBattleOrderBySequenceOrderAsc(battle);

        long p1Correct = countCorrect(battleQuestions, battle.getPlayerOne());
        long p2Correct = countCorrect(battleQuestions, battle.getPlayerTwo());

        User winner = null;
        if (p1Correct > p2Correct) {
            winner = battle.getPlayerOne();
        } else if (p2Correct > p1Correct) {
            winner = battle.getPlayerTwo();
        }

        battle.setWinner(winner);
        battle.setStatus(Battle.Status.COMPLETED);
        battle.setEndedAt(java.time.Instant.now());
        battleRepository.save(battle);

        updateRatingsAndRecord(battle, winner);

        return toResponse(battle);
    }

    private long countCorrect(List<BattleQuestion> battleQuestions, User user) {
        return battleQuestions.stream()
                .flatMap(bq -> battleAnswerRepository.findByBattleQuestion(bq).stream())
                .filter(a -> a.getUser().getId().equals(user.getId()) && a.getIsCorrect())
                .count();
    }

    private void updateRatingsAndRecord(Battle battle, User winner) {
        User p1 = battle.getPlayerOne();
        User p2 = battle.getPlayerTwo();

        // Simple fixed-K rating adjustment swap for real Elo/Glicko later
        final int K = 20;

        if (winner == null) {
            // draw no rating change
            return;
        }

        User loser = winner.getId().equals(p1.getId()) ? p2 : p1;

        winner.setRating(winner.getRating() + K);
        winner.setWins(winner.getWins() + 1);

        loser.setRating(Math.max(0, loser.getRating() - K));
        loser.setLosses(loser.getLosses() + 1);

        userRepository.save(winner);
        userRepository.save(loser);
    }

    public List<Battle> getBattlesForUser(User user) {
        return battleRepository.findAllForUser(user);
    }

    private Battle getBattle(Long battleId) {
        return battleRepository.findById(battleId)
                .orElseThrow(() -> new RuntimeException("Battle not found: " + battleId));
    }

    private BattleResponse toResponse(Battle battle) {
        List<BattleQuestion> battleQuestions = battleQuestionRepository.findByBattleOrderBySequenceOrderAsc(battle);

        List<BattleResponse.QuestionSummary> summaries = battleQuestions.stream()
                .map(bq -> BattleResponse.QuestionSummary.builder()
                        .battleQuestionId(bq.getId())
                        .questionId(bq.getQuestion().getId())
                        .prompt(bq.getQuestion().getPrompt())
                        .sequenceOrder(bq.getSequenceOrder())
                        .build())
                .collect(Collectors.toList());

        return BattleResponse.builder()
                .id(battle.getId())
                .playerOneId(battle.getPlayerOne().getId())
                .playerOneUsername(battle.getPlayerOne().getUsername())
                .playerTwoId(battle.getPlayerTwo().getId())
                .playerTwoUsername(battle.getPlayerTwo().getUsername())
                .winnerId(battle.getWinner() != null ? battle.getWinner().getId() : null)
                .status(battle.getStatus().name())
                .createdAt(battle.getCreatedAt())
                .endedAt(battle.getEndedAt())
                .questions(summaries)
                .build();
    }
}