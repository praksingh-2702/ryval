package com.ryval.backend.service;

import com.ryval.backend.dto.response.UserProfileResponse;
import com.ryval.backend.model.User;
import com.ryval.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User getByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    public UserProfileResponse getProfile(String username) {
        User user = getByUsername(username);
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .rating(user.getRating())
                .wins(user.getWins())
                .losses(user.getLosses())
                .build();
    }
}