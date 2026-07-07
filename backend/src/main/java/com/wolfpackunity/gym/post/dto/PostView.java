package com.wolfpackunity.gym.post.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PostView(
        UUID id,
        String type,
        String title,
        String slug,
        String body,
        String youtubeUrl,
        String authorName,
        OffsetDateTime publishedAt
) {}
