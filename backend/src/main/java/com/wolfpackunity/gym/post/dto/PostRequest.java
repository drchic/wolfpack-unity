package com.wolfpackunity.gym.post.dto;

public record PostRequest(
        String type,
        String title,
        String slug,
        String body,
        String youtubeUrl
) {}
