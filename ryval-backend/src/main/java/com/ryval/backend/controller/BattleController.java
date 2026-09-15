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
            return ResponseEntity.ok(battleService.startBattle(battle.get().getId(), authentication.getName()));
        }
        return ResponseEntity.ok(Map.of("status", "QUEUED"));
    }

    @PostMapping("/queue/leave")
    public ResponseEntity<Void> leaveQueue(Authentication authentication) {
        User user = userService.getByUsername(authentication.getName());
        matchmakingService.leaveQueue(user);
        return ResponseEntity.noContent().build();
    }

    // Full battle state, personalized to the requester (their current
    // question index, their countdown deadline, whether they/opponent have
    // finished). Used both as the live poll during a battle and to
    // reconstruct state after a page refresh.
    @GetMapping("/{battleId}")
    public ResponseEntity<BattleResponse> getBattleState(
            @PathVariable Long battleId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(battleService.getBattleState(battleId, authentication.getName()));
    }

    @PostMapping("/{battleId}/answer")
    public ResponseEntity<BattleResponse> submitAnswer(
            @PathVariable Long battleId,
            @RequestBody SubmitAnswerRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(battleService.submitAnswer(authentication.getName(), request));
    }

    // Called by the frontend when a player's local countdown for their
    // current question hits zero. The backend independently verifies the
    // deadline has actually passed before honoring it.
    @PostMapping("/{battleId}/skip")
    public ResponseEntity<BattleResponse> skipQuestion(
            @PathVariable Long battleId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(battleService.skipQuestion(battleId, authentication.getName()));
    }

    @PostMapping("/{battleId}/end")
    public ResponseEntity<BattleResponse> endBattle(
            @PathVariable Long battleId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(battleService.endBattle(battleId, authentication.getName()));
    }

    @GetMapping("/me")
    public ResponseEntity<List<Battle>> getMyBattles(Authentication authentication) {
        User user = userService.getByUsername(authentication.getName());
        return ResponseEntity.ok(battleService.getBattlesForUser(user));
    }
}