package com.ryval.backend.service;

import com.ryval.backend.dto.request.SubmitAnswerRequest;
import com.ryval.backend.dto.response.BattleResponse;
import com.ryval.backend.model.*;
import com.ryval.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BattleService {

    private static final int QUESTIONS_PER_BATTLE = 5;
    private static final long QUESTION_TIMEOUT_SECONDS = 10;
    private static final long FORFEIT_GRACE_SECONDS = 30;
    private static final String TIMEOUT_MARKER = "__TIMEOUT__";

    // Must match FEEDBACK_DURATION_MS in Battle.jsx.
    private static final long FEEDBACK_DELAY_MS = 1500;

    private final BattleRepository battleRepository;
    private final BattleQuestionRepository battleQuestionRepository;
    private final BattleAnswerRepository battleAnswerRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;

    @Transactional
    public BattleResponse startBattle(Long battleId, String username) {
        // BUG FIX: previously used a plain findById here. Two callers can
        // both hit this method for the same battle at nearly the same time
        // - e.g. P2's synchronous match triggers startBattle at the exact
        // moment P1's next queue-poll discovers the same battle and also
        // triggers startBattle. With no lock, both can read
        // status == PENDING before either commits, and both insert their
        // own 5 BattleQuestion rows - producing 10 total rows with
        // duplicate sequence_order values, mismatched "current question"
        // per player, and "Not your current question" errors later.
        // findByIdWithLock takes a pessimistic write lock, so the second
        // caller blocks until the first transaction commits, then sees
        // status == IN_PROGRESS and returns immediately without touching
        // battle_questions.
        Battle battle = battleRepository.findByIdWithLock(battleId)
                .orElseThrow(() -> new RuntimeException("Battle not found: " + battleId));

        if (battle.getStatus() != Battle.Status.PENDING) {
            return toResponse(battle, username);
        }

        List<Question> questions = questionRepository.findAll();
        java.util.Collections.shuffle(questions);
        List<Question> selected = questions.stream()
                .limit(QUESTIONS_PER_BATTLE)
                .collect(Collectors.toList());

        for (int i = 0; i < selected.size(); i++) {
            BattleQuestion bq = BattleQuestion.builder()
                    .battle(battle)
                    .question(selected.get(i))
                    .sequenceOrder(i + 1)
                    .build();
            battleQuestionRepository.save(bq);
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

        return toResponse(battle, username);
    }

    @Transactional
    public BattleResponse submitAnswer(String username, SubmitAnswerRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        BattleQuestion battleQuestion = battleQuestionRepository.findById(request.getBattleQuestionId())
                .orElseThrow(() -> new RuntimeException("Battle question not found"));

        Battle battle = battleRepository.findByIdWithLock(battleQuestion.getBattle().getId())
                .orElseThrow(() -> new RuntimeException("Battle not found"));

        checkAndApplyForfeit(battle);
        touchLastSeen(battle, user);

        if (battle.getStatus() != Battle.Status.IN_PROGRESS) {
            return toResponse(battle, username);
        }

        boolean isPlayerOne = battle.getPlayerOne().getId().equals(user.getId());
        if (isPlayerOne ? battle.isPlayerOneFinished() : battle.isPlayerTwoFinished()) {
            return toResponse(battle, username);
        }

        if (battleAnswerRepository.findByBattleQuestionAndUser(battleQuestion, user).isPresent()) {
            return toResponse(battle, username);
        }

        int currentIndex = isPlayerOne ? battle.getPlayerOneQuestionIndex() : battle.getPlayerTwoQuestionIndex();
        if (battleQuestion.getSequenceOrder() - 1 != currentIndex) {
            throw new RuntimeException("Not your current question");
        }

        boolean isCorrect = battleQuestion.getQuestion().getCorrectAnswer()
                .trim().equalsIgnoreCase(request.getAnswer().trim());

        recordAnswerAndAdvance(battle, user, isPlayerOne, battleQuestion,
                request.getAnswer(), isCorrect, request.getResponseTimeMs());

        return toResponse(battle, username);
    }

    @Transactional
    public BattleResponse skipQuestion(Long battleId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Battle battle = battleRepository.findByIdWithLock(battleId)
                .orElseThrow(() -> new RuntimeException("Battle not found: " + battleId));

        checkAndApplyForfeit(battle);
        touchLastSeen(battle, user);

        if (battle.getStatus() != Battle.Status.IN_PROGRESS) {
            return toResponse(battle, username);
        }

        boolean isPlayerOne = battle.getPlayerOne().getId().equals(user.getId());
        if (isPlayerOne ? battle.isPlayerOneFinished() : battle.isPlayerTwoFinished()) {
            return toResponse(battle, username);
        }

        int currentIndex = isPlayerOne ? battle.getPlayerOneQuestionIndex() : battle.getPlayerTwoQuestionIndex();
        List<BattleQuestion> battleQuestions = battleQuestionRepository.findByBattleOrderBySequenceOrderAsc(battle);
        if (currentIndex >= battleQuestions.size()) {
            return toResponse(battle, username);
        }
        BattleQuestion current = battleQuestions.get(currentIndex);

        if (battleAnswerRepository.findByBattleQuestionAndUser(current, user).isPresent()) {
            return toResponse(battle, username);
        }

        Instant deadline = isPlayerOne ? battle.getPlayerOneQuestionDeadline() : battle.getPlayerTwoQuestionDeadline();
        if (deadline != null && Instant.now().isBefore(deadline)) {
            return toResponse(battle, username);
        }

        recordAnswerAndAdvance(battle, user, isPlayerOne, current, TIMEOUT_MARKER, false, null);

        return toResponse(battle, username);
    }

    @Transactional
    public BattleResponse getBattleState(Long battleId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Battle battle = battleRepository.findByIdWithLock(battleId)
                .orElseThrow(() -> new RuntimeException("Battle not found: " + battleId));

        checkAndApplyForfeit(battle);
        touchLastSeen(battle, user);

        return toResponse(battle, username);
    }

    @Transactional
    public BattleResponse endBattle(Long battleId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Battle battle = battleRepository.findByIdWithLock(battleId)
                .orElseThrow(() -> new RuntimeException("Battle not found: " + battleId));

        checkAndApplyForfeit(battle);
        touchLastSeen(battle, user);

        if (battle.getStatus() == Battle.Status.COMPLETED) {
            return toResponse(battle, username);
        }

        boolean isPlayerOne = battle.getPlayerOne().getUsername().equals(username);
        if (isPlayerOne) {
            battle.setPlayerOneFinished(true);
        } else {
            battle.setPlayerTwoFinished(true);
        }
        battleRepository.save(battle);

        if (!battle.isPlayerOneFinished() || !battle.isPlayerTwoFinished()) {
            return toResponse(battle, username);
        }

        List<BattleQuestion> battleQuestions =
                battleQuestionRepository.findByBattleOrderBySequenceOrderAsc(battle);

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
        battle.setEndedAt(Instant.now());
        battle.setEndReason("NORMAL");
        battleRepository.save(battle);

        updateRatingsAndRecord(battle, winner);

        return toResponse(battle, username);
    }

    private void recordAnswerAndAdvance(Battle battle, User user, boolean isPlayerOne, BattleQuestion question,
                                         String submittedAnswer, boolean isCorrect, Long responseTimeMs) {
        BattleAnswer answer = BattleAnswer.builder()
                .battleQuestion(question)
                .user(user)
                .submittedAnswer(submittedAnswer)
                .isCorrect(isCorrect)
                .responseTimeMs(responseTimeMs)
                .build();
        battleAnswerRepository.save(answer);

        int newIndex = (isPlayerOne ? battle.getPlayerOneQuestionIndex() : battle.getPlayerTwoQuestionIndex()) + 1;
        Instant newDeadline = newIndex < QUESTIONS_PER_BATTLE
                ? Instant.now().plusMillis(FEEDBACK_DELAY_MS).plusSeconds(QUESTION_TIMEOUT_SECONDS)
                : null;

        if (isPlayerOne) {
            battle.setPlayerOneQuestionIndex(newIndex);
            battle.setPlayerOneQuestionDeadline(newDeadline);
        } else {
            battle.setPlayerTwoQuestionIndex(newIndex);
            battle.setPlayerTwoQuestionDeadline(newDeadline);
        }
        battleRepository.save(battle);
    }

    private void checkAndApplyForfeit(Battle battle) {
        if (battle.getStatus() != Battle.Status.IN_PROGRESS) {
            return;
        }
        Instant now = Instant.now();

        if (battle.isPlayerTwoFinished() && !battle.isPlayerOneFinished()) {
            Instant reference = battle.getPlayerOneLastSeenAt() != null
                    ? battle.getPlayerOneLastSeenAt() : battle.getCreatedAt();
            if (reference != null && !now.isBefore(reference.plusSeconds(FORFEIT_GRACE_SECONDS))) {
                applyForfeit(battle, battle.getPlayerTwo());
                return;
            }
        }

        if (battle.isPlayerOneFinished() && !battle.isPlayerTwoFinished()) {
            Instant reference = battle.getPlayerTwoLastSeenAt() != null
                    ? battle.getPlayerTwoLastSeenAt() : battle.getCreatedAt();
            if (reference != null && !now.isBefore(reference.plusSeconds(FORFEIT_GRACE_SECONDS))) {
                applyForfeit(battle, battle.getPlayerOne());
            }
        }
    }

    private void applyForfeit(Battle battle, User winner) {
        battle.setWinner(winner);
        battle.setStatus(Battle.Status.COMPLETED);
        battle.setEndedAt(Instant.now());
        battle.setEndReason("FORFEIT");
        battleRepository.save(battle);
        updateRatingsAndRecord(battle, winner);
    }

    private void touchLastSeen(Battle battle, User user) {
        boolean isPlayerOne = battle.getPlayerOne().getId().equals(user.getId());
        if (isPlayerOne) {
            battle.setPlayerOneLastSeenAt(Instant.now());
        } else {
            battle.setPlayerTwoLastSeenAt(Instant.now());
        }
        battleRepository.save(battle);
    }

    private long countCorrect(List<BattleQuestion> battleQuestions, User user) {
        return battleQuestions.stream()
                .flatMap(bq -> battleAnswerRepository.findByBattleQuestion(bq).stream())
                .filter(a -> a.getUser().getId().equals(user.getId()) && a.getIsCorrect())
                .count();
    }

    private void updateRatingsAndRecord(Battle battle, User winner) {
        if (winner == null) {
            return;
        }

        User p1 = battle.getPlayerOne();
        User p2 = battle.getPlayerTwo();
        final int K = 20;

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

    private BattleResponse toResponse(Battle battle, String username) {
        List<BattleQuestion> battleQuestions =
                battleQuestionRepository.findByBattleOrderBySequenceOrderAsc(battle);

        User requester = username != null ? userRepository.findByUsername(username).orElse(null) : null;
        boolean isPlayerOne = requester != null && battle.getPlayerOne().getId().equals(requester.getId());

        User finalRequester = requester;
        List<BattleResponse.QuestionSummary> summaries = battleQuestions.stream()
                .map(bq -> {
                    BattleResponse.QuestionSummary.QuestionSummaryBuilder builder = BattleResponse.QuestionSummary.builder()
                            .battleQuestionId(bq.getId())
                            .questionId(bq.getQuestion().getId())
                            .prompt(bq.getQuestion().getPrompt())
                            .optionA(bq.getQuestion().getOptionA())
                            .optionB(bq.getQuestion().getOptionB())
                            .optionC(bq.getQuestion().getOptionC())
                            .optionD(bq.getQuestion().getOptionD())
                            .sequenceOrder(bq.getSequenceOrder());

                    if (finalRequester != null) {
                        battleAnswerRepository.findByBattleQuestionAndUser(bq, finalRequester).ifPresent(ans ->
                                builder.myAnswer(ans.getSubmittedAnswer())
                                        .myAnswerCorrect(ans.getIsCorrect())
                                        .myAnswerWasTimeout(TIMEOUT_MARKER.equals(ans.getSubmittedAnswer())));
                    }

                    return builder.build();
                })
                .collect(Collectors.toList());

        BattleResponse.BattleResponseBuilder response = BattleResponse.builder()
                .id(battle.getId())
                .playerOneId(battle.getPlayerOne().getId())
                .playerOneUsername(battle.getPlayerOne().getUsername())
                .playerTwoId(battle.getPlayerTwo().getId())
                .playerTwoUsername(battle.getPlayerTwo().getUsername())
                .winnerId(battle.getWinner() != null ? battle.getWinner().getId() : null)
                .status(battle.getStatus().name())
                .endReason(battle.getEndReason())
                .createdAt(battle.getCreatedAt())
                .endedAt(battle.getEndedAt())
                .questions(summaries);

        if (requester != null) {
            boolean myFinished = isPlayerOne ? battle.isPlayerOneFinished() : battle.isPlayerTwoFinished();
            boolean opponentFinished = isPlayerOne ? battle.isPlayerTwoFinished() : battle.isPlayerOneFinished();
            Integer myIndex = isPlayerOne ? battle.getPlayerOneQuestionIndex() : battle.getPlayerTwoQuestionIndex();
            Instant myDeadline = isPlayerOne ? battle.getPlayerOneQuestionDeadline() : battle.getPlayerTwoQuestionDeadline();

            response.myFinished(myFinished)
                    .opponentFinished(opponentFinished)
                    .myQuestionIndex(myIndex)
                    .myQuestionDeadline(myFinished ? null : myDeadline);
        }

        return response.build();
    }
}