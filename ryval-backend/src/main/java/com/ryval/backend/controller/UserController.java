package com.ryval.backend.controller;

import com.ryval.backend.dto.request.UpdateAvatarRequest;
import com.ryval.backend.dto.response.UserProfileResponse;
import com.ryval.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(Authentication authentication) {
        return ResponseEntity.ok(userService.getProfile(authentication.getName()));
    }

    // Replaces the caller's sigil. Returns the updated profile so the
    // frontend can refresh its cache without a second request.
    @PutMapping("/me/avatar")
    public ResponseEntity<UserProfileResponse> updateAvatar(
            @Valid @RequestBody UpdateAvatarRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(userService.updateAvatar(authentication.getName(), request));
    }
}