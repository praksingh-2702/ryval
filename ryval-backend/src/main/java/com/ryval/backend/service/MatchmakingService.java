package com.ryval.backend.service;

import com.ryval.backend.model.Battle;
import com.ryval.backend.model.MatchmakingQueue;
import com.ryval.backend.model.User;
import com.ryval.backend.repository.BattleRepository;
import com.ryval.backend.repository.MatchmakingQueueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MatchmakingService {

    private static final int INITIAL_RATING_RANGE = 100;

    private final MatchmakingQueueRepository matchmakingQueueRepository;
    private final BattleRepository battleRepository;

    @Transactional
    public Optional<Battle> joinQueue(User user) {
        // If this user was already matched by the OTHER player's poll request,
        // pick that battle up here instead of getting silently re-queued.
        Optional<Battle> existing = battleRepository.findActiveBattleForUser(user);
        if (existing.isPresent()) {
            return existing;
        }

        matchmakingQueueRepository.findByUser(user).ifPresent(matchmakingQueueRepository::delete);

        // Locks the single best candidate row (FOR UPDATE) so a concurrent poll
        // from another user can't grab the same opponent at the same time.
        List<MatchmakingQueue> candidates = matchmakingQueueRepository.findCandidatesForUpdate(
                user, user.getRating(), INITIAL_RATING_RANGE, PageRequest.of(0, 1));

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
            // Two near-simultaneous join requests from the same user can both pass
            // the "delete existing entry" check before either insert commits,
            // tripping the unique constraint on user_id. Not a real error — treat
            // as "already queued".
        }

        return Optional.empty();
    }

    public void leaveQueue(User user) {
        matchmakingQueueRepository.deleteByUser(user);
    }
}