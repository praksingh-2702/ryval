package com.ryval.backend.service;

import com.ryval.backend.config.AvatarCatalog;
import com.ryval.backend.dto.request.UpdateAvatarRequest;
import com.ryval.backend.dto.response.AvatarResponse;
import com.ryval.backend.dto.response.UserProfileResponse;
import com.ryval.backend.model.User;
import com.ryval.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AvatarCatalog avatarCatalog;

    public User getByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    public UserProfileResponse getProfile(String username) {
        return toProfile(getByUsername(username));
    }

    @Transactional
    public UserProfileResponse updateAvatar(String username, UpdateAvatarRequest request) {
        avatarCatalog.validate(request);

        User user = getByUsername(username);
        user.setAvatarShape(request.getShape());
        user.setAvatarEyes(request.getEyes());
        user.setAvatarMark(request.getMark());
        user.setAvatarColor(request.getColor().toUpperCase(Locale.ROOT));
        userRepository.save(user);

        return toProfile(user);
    }

    private UserProfileResponse toProfile(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .rating(user.getRating())
                .wins(user.getWins())
                .losses(user.getLosses())
                .draws(user.getDraws())
                .avatar(AvatarResponse.from(user))
                .build();
    }
}