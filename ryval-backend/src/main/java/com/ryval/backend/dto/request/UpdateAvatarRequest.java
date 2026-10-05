package com.ryval.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateAvatarRequest {

    @NotBlank
    private String shape;

    @NotBlank
    private String eyes;

    @NotBlank
    private String mark;

    @NotBlank
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Color must be a hex value like #2D4BFF")
    private String color;
}