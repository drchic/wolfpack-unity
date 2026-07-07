package com.wolfpackunity.gym.post.dto;

import jakarta.validation.constraints.NotBlank;

public record PostRequest(
        @NotBlank String type,
        @NotBlank String title,
        String slug,
        String body,
        String youtubeUrl
) {}
