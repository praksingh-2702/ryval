package com.ryval.backend.service;

import com.ryval.backend.dto.response.LeaderboardResponse;
import com.ryval.backend.model.LeaderboardSnapshot;
import com.ryval.backend.model.User;
import com.ryval.backend.repository.LeaderboardSnapshotRepository;
import com.ryval.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final UserRepository userRepository;
    private final LeaderboardSnapshotRepository leaderboardSnapshotRepository;

    /** Live leaderboard computed directly from current user ratings. */
    public List<LeaderboardResponse> getLiveLeaderboard(int limit) {
        List<User> topUsers = userRepository.findAll(
                PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "rating"))
        ).getContent();

        return IntStream.range(0, topUsers.size())
                .mapToObj(i -> LeaderboardResponse.builder()
                        .rank(i + 1)
                        .userId(topUsers.get(i).getId())
                        .username(topUsers.get(i).getUsername())
                        .rating(topUsers.get(i).getRating())
                        .build())
                .collect(Collectors.toList());
    }

    /** Periodically called (e.g. via a scheduled job) to persist a leaderboard snapshot. */
    @Transactional
    public void recordSnapshot(int topN) {
        List<LeaderboardResponse> current = getLiveLeaderboard(topN);

        current.forEach(entry -> {
            User user = userRepository.findById(entry.getUserId()).orElseThrow();
            LeaderboardSnapshot snapshot = LeaderboardSnapshot.builder()
                    .user(user)
                    .rank(entry.getRank())
                    .rating(entry.getRating())
                    .build();
            leaderboardSnapshotRepository.save(snapshot);
        });
    }
}