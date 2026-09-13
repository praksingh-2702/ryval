package com.ryval.backend.repository;

import com.ryval.backend.model.LeaderboardSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeaderboardSnapshotRepository extends JpaRepository<LeaderboardSnapshot, Long> {
    List<LeaderboardSnapshot> findTop50ByOrderByRankAsc();
}