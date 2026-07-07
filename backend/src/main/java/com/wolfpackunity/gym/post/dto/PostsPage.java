package com.wolfpackunity.gym.post.dto;

import java.util.List;

public record PostsPage(List<PostView> content, long total, int page, int size) {}
