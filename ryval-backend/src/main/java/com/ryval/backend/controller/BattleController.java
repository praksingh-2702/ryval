package com.ryval.backend.controller;

import com.ryval.backend.dto.request.SubmitAnswerRequest;
import com.ryval.backend.dto.response.BattleResponse;
import com.ryval.backend.model.Battle;
import com.ryval.backend.model.User;
import com.ryval.backend.service.BattleService;
import com.ryval.backend.service.MatchmakingService;
import com.ryval.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/battles")
@RequiredArgsConstructor
public class BattleController {

    private final BattleService battleService;
    private final MatchmakingService matchmakingService;
    private final UserService userService;

    @PostMapping("/queue/join")
    public ResponseEntity<?> joinQueue(Authentication authentication) {
        User user = userService.getByUsername(authentication.getName());
        Optional<Battle> battle = matchmakingService.joinQueue(user);

        if (battle.isPresent()) {
            return ResponseEntity.ok(battleService.startBattle(battle.get().getId()));
        }
        return ResponseEntity.ok(Map.of("status", "QUEUED"));
    }

    @PostMapping("/queue/leave")
    public ResponseEntity<Void> leaveQueue(Authentication authentication) {
        User user = userService.getByUsername(authentication.getName());
        matchmakingService.leaveQueue(user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{battleId}/answer")
    public ResponseEntity<?> submitAnswer(
            @PathVariable Long battleId,
            @RequestBody SubmitAnswerRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(battleService.submitAnswer(authentication.getName(), request));
    }

    @PostMapping("/{battleId}/end")
    public ResponseEntity<BattleResponse> endBattle(@PathVariable Long battleId) {
        return ResponseEntity.ok(battleService.endBattle(battleId));
    }

    @GetMapping("/me")
    public ResponseEntity<List<Battle>> getMyBattles(Authentication authentication) {
        User user = userService.getByUsername(authentication.getName());
        return ResponseEntity.ok(battleService.getBattlesForUser(user));
    }
}