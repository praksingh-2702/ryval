package com.ryval.backend.service;

import com.ryval.backend.model.Battle;
import com.ryval.backend.model.MatchmakingQueue;
import com.ryval.backend.model.User;
import com.ryval.backend.repository.BattleRepository;
import com.ryval.backend.repository.MatchmakingQueueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MatchmakingService {

    private static final int INITIAL_RATING_RANGE = 100;

    private final MatchmakingQueueRepository matchmakingQueueRepository;
    private final BattleRepository battleRepository;

    /**
     * Adds a user to the queue, and immediately tries to find an opponent.
     * Returns the created Battle if a match was found, otherwise empty (still queued).
     */
    public Optional<Battle> joinQueue(User user) {
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
        matchmakingQueueRepository.save(entry);

        return Optional.empty();
    }

    public void leaveQueue(User user) {
        matchmakingQueueRepository.deleteByUser(user);
    }
}