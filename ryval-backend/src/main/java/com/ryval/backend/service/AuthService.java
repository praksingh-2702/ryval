package com.ryval.backend.service;

import com.ryval.backend.config.AvatarCatalog;
import com.ryval.backend.dto.request.LoginRequest;
import com.ryval.backend.dto.request.RegisterRequest;
import com.ryval.backend.dto.response.AuthResponse;
import com.ryval.backend.dto.response.AvatarResponse;
import com.ryval.backend.model.User;
import com.ryval.backend.repository.UserRepository;
import com.ryval.backend.security.CustomUserDetails;
import com.ryval.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final AvatarCatalog avatarCatalog;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Every new account starts with a random sigil, so no profile is
        // ever blank. The frontend sends the player to the customizer next.
        AvatarResponse starter = avatarCatalog.randomStarter();

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .avatarShape(starter.getShape())
                .avatarEyes(starter.getEyes())
                .avatarMark(starter.getMark())
                .avatarColor(starter.getColor())
                .build();

        userRepository.save(user);

        String token = jwtService.generateToken(new CustomUserDetails(user));

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        String token = jwtService.generateToken(new CustomUserDetails(user));

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .build();
    }
}