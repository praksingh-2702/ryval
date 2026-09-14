package com.ryval.backend.repository;

import com.ryval.backend.model.MatchmakingQueue;
import com.ryval.backend.model.User;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MatchmakingQueueRepository extends JpaRepository<MatchmakingQueue, Long> {
    Optional<MatchmakingQueue> findByUser(User user);
    void deleteByUser(User user);

    // PESSIMISTIC_WRITE: locks the returned row(s) with SELECT ... FOR UPDATE, so
    // if two users poll at the same instant and both would match the same
    // candidate, the second transaction BLOCKS here until the first commits (and
    // deletes that row) — then re-reads and correctly sees it's gone, instead of
    // both transactions grabbing the same row and one silently rolling back.
    //
    // javax.persistence.lock.timeout caps how long the second transaction waits,
    // so a stuck/slow transaction can't hang every other poller indefinitely.
    // Pageable limits the lock to just the single row we'll actually use, instead
    // of locking every candidate in range.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints({@QueryHint(name = "javax.persistence.lock.timeout", value = "3000")})
    @Query("SELECT m FROM MatchmakingQueue m WHERE m.user <> :user AND ABS(m.ratingAtQueueTime - :rating) <= :range ORDER BY m.queuedAt ASC")
    List<MatchmakingQueue> findCandidatesForUpdate(@Param("user") User user, @Param("rating") Integer rating, @Param("range") Integer range, Pageable pageable);
}