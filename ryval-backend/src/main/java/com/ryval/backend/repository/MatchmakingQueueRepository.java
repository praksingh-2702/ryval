package com.ryval.backend.repository;

import com.ryval.backend.model.MatchmakingQueue;
import com.ryval.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MatchmakingQueueRepository extends JpaRepository<MatchmakingQueue, Long> {
    Optional<MatchmakingQueue> findByUser(User user);
    void deleteByUser(User user);

    // Kept in case anything else still calls this directly.
    @Query("SELECT m FROM MatchmakingQueue m WHERE m.user <> :user AND ABS(m.ratingAtQueueTime - :rating) <= :range ORDER BY m.queuedAt ASC")
    List<MatchmakingQueue> findCandidates(@Param("user") User user, @Param("rating") Integer rating, @Param("range") Integer range);

    // BUG FIX: range is now computed dynamically per-candidate in
    // MatchmakingService (widens with wait time), so we fetch ALL other
    // queued users here and filter/rank in Java instead of baking a fixed
    // range into the SQL.
    @Query("SELECT m FROM MatchmakingQueue m WHERE m.user <> :user ORDER BY m.queuedAt ASC")
    List<MatchmakingQueue> findAllOtherCandidates(@Param("user") User user);
}