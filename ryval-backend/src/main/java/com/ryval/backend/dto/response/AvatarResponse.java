package com.ryval.backend.dto.response;

import com.ryval.backend.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvatarResponse {
    private String shape;
    private String eyes;
    private String mark;
    private String color;

    public static AvatarResponse from(User user) {
        return AvatarResponse.builder()
                .shape(user.getAvatarShape())
                .eyes(user.getAvatarEyes())
                .mark(user.getAvatarMark())
                .color(user.getAvatarColor())
                .build();
    }
}