package com.ryval.backend.controller;

import com.ryval.backend.dto.response.LeaderboardResponse;
import com.ryval.backend.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping
    public ResponseEntity<List<LeaderboardResponse>> getLeaderboard(
            @RequestParam(defaultValue = "50") int limit
    ) {
        return ResponseEntity.ok(leaderboardService.getLiveLeaderboard(limit));
    }
}