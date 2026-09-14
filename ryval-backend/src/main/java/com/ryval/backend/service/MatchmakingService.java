package com.ryval.backend.service;

import com.ryval.backend.model.Battle;
import com.ryval.backend.model.MatchmakingQueue;
import com.ryval.backend.model.User;
import com.ryval.backend.repository.BattleRepository;
import com.ryval.backend.repository.MatchmakingQueueRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MatchmakingService {

    private static final int INITIAL_RATING_RANGE = 100;

    // Arbitrary constant key for the advisory lock. Only used to serialize
    // matchmaking decisions - not tied to any real entity ID.
    private static final long MATCHMAKING_LOCK_KEY = 927364;

    private final MatchmakingQueueRepository matchmakingQueueRepository;
    private final BattleRepository battleRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public Optional<Battle> joinQueue(User user) {
        Optional<Battle> existing = battleRepository.findActiveBattleForUser(user);
        if (existing.isPresent()) {
            return existing;
        }

        // Postgres advisory transaction lock: blocks any other joinQueue call
        // (for ANY user) from proceeding past this line until this transaction
        // commits or rolls back. Without this, two users polling within
        // milliseconds of each other can each independently see the other as
        // "the candidate to match with" and both create a separate Battle row
        // for the same pair - row-level FOR UPDATE locks don't prevent this,
        // since each transaction locks a DIFFERENT row (the other user's row).
        // This fully serializes the match-or-queue decision so only one
        // Battle can ever be created per pair.
        entityManager.createNativeQuery("SELECT pg_advisory_xact_lock(:key)")
                .setParameter("key", MATCHMAKING_LOCK_KEY)
                .getSingleResult();

        matchmakingQueueRepository.findByUser(user).ifPresent(matchmakingQueueRepository::delete);

        List<MatchmakingQueue> candidates = matchmakingQueueRepository.findCandidates(
                user, user.getRating(), INITIAL_RATING_RANGE);

        if (!candidates.isEmpty()) {
            MatchmakingQueue opponentEntry = candidates.get(0);
            matchmakingQueueRepository.delete(opponentEntry);

            Battle battle = Battle.builder()
                    .playerOne(user)
                    .playerTwo(opponentEntry.getUser())
                    .status(Battle.Status.PENDING)
                    .build();

            return Optional.of(battleRepository.save(battle));
        }

        MatchmakingQueue entry = MatchmakingQueue.builder()
                .user(user)
                .ratingAtQueueTime(user.getRating())
                .build();

        try {
            matchmakingQueueRepository.save(entry);
        } catch (DataIntegrityViolationException ex) {
            // ignore — already queued via concurrent request
        }

        return Optional.empty();
    }

    public void leaveQueue(User user) {
        matchmakingQueueRepository.deleteByUser(user);
    }
}