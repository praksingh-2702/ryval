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

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MatchmakingService {

    // BUG FIX: previously a single fixed INITIAL_RATING_RANGE = 100 was used
    // forever — two players whose ratings differed by more than 100 could
    // NEVER match no matter how long either waited. Confirmed via DB: users
    // at rating 1100 and 1240 (diff 140) were both stuck in
    // matchmaking_queue indefinitely, each poll correctly finding zero
    // candidates under the old fixed-range query. Range now widens the
    // longer either side has waited, so a match eventually happens.
    private static final int INITIAL_RATING_RANGE = 100;
    private static final int MAX_RATING_RANGE = 1000; // effectively "match anyone" ceiling
    private static final int RANGE_GROWTH_PER_SECOND = 5; // range grows by this much per second waited

    private static final long MATCHMAKING_LOCK_KEY = 927364;
    private static final long STALE_BATTLE_SECONDS = 300; // 5 minutes

    private final MatchmakingQueueRepository matchmakingQueueRepository;
    private final BattleRepository battleRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public Optional<Battle> joinQueue(User user) {
        Optional<Battle> existing = battleRepository.findActiveBattleForUser(user);
        if (existing.isPresent()) {
            Battle b = existing.get();
            boolean isStale = b.getCreatedAt() != null &&
                    b.getCreatedAt().isBefore(Instant.now().minusSeconds(STALE_BATTLE_SECONDS));
            if (!isStale) {
                return existing;
            }
            b.setStatus(Battle.Status.COMPLETED);
            b.setEndedAt(Instant.now());
            b.setEndReason("FORFEIT");
            battleRepository.save(b);
        }

        entityManager.createNativeQuery("SELECT pg_advisory_xact_lock(:key)")
                .setParameter("key", MATCHMAKING_LOCK_KEY)
                .getSingleResult();

        // Preserve the original queued_at if this user already had a queue
        // entry (e.g. their previous poll created one, or they rejoined
        // after a refresh), so the wait-time-based range widening below
        // keeps counting from when they ACTUALLY started waiting rather
        // than resetting to zero on every poll.
        Optional<MatchmakingQueue> ownExisting = matchmakingQueueRepository.findByUser(user);
        Instant myQueuedSince = ownExisting.map(MatchmakingQueue::getQueuedAt).orElse(Instant.now());
        ownExisting.ifPresent(matchmakingQueueRepository::delete);

        List<MatchmakingQueue> candidates = matchmakingQueueRepository.findAllOtherCandidates(user);

        MatchmakingQueue bestMatch = null;
        int smallestDiff = Integer.MAX_VALUE;

        for (MatchmakingQueue candidate : candidates) {
            long candidateWaitSeconds = Duration.between(candidate.getQueuedAt(), Instant.now()).getSeconds();
            long myWaitSeconds = Duration.between(myQueuedSince, Instant.now()).getSeconds();
            // Use whichever side has waited longer to decide how wide the
            // allowed range is, so a long-waiting player becomes matchable
            // by a fresh joiner even though the fresh joiner's own range is
            // still tight.
            long effectiveWaitSeconds = Math.max(candidateWaitSeconds, myWaitSeconds);

            int allowedRange = (int) Math.min(
                    MAX_RATING_RANGE,
                    INITIAL_RATING_RANGE + (effectiveWaitSeconds * RANGE_GROWTH_PER_SECOND)
            );

            int diff = Math.abs(candidate.getRatingAtQueueTime() - user.getRating());
            if (diff <= allowedRange && diff < smallestDiff) {
                bestMatch = candidate;
                smallestDiff = diff;
            }
        }

        if (bestMatch != null) {
            matchmakingQueueRepository.delete(bestMatch);

            Battle battle = Battle.builder()
                    .playerOne(user)
                    .playerTwo(bestMatch.getUser())
                    .status(Battle.Status.PENDING)
                    .build();

            return Optional.of(battleRepository.save(battle));
        }

        MatchmakingQueue entry = MatchmakingQueue.builder()
                .user(user)
                .ratingAtQueueTime(user.getRating())
                .queuedAt(myQueuedSince)
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