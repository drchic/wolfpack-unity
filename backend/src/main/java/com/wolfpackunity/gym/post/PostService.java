package com.wolfpackunity.gym.post;

import com.wolfpackunity.gym.exception.ErrorCode;
import com.wolfpackunity.gym.exception.GymException;
import com.wolfpackunity.gym.jooq.enums.PostType;
import com.wolfpackunity.gym.post.dto.PostRequest;
import com.wolfpackunity.gym.post.dto.PostView;
import com.wolfpackunity.gym.post.dto.PostsPage;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class PostService {

    private final PostRepository repo;

    public PostService(PostRepository repo) { this.repo = repo; }

    public PostsPage list(String type, int page, int size) {
        PostType postType = type != null ? PostType.valueOf(type) : null;
        List<PostView> content = repo.findAll(postType, page, size);
        long total = repo.count(postType);
        return new PostsPage(content, total, page, size);
    }

    public PostView get(String slug) {
        return repo.findBySlug(slug)
                .orElseThrow(() -> new GymException(ErrorCode.POST_NOT_FOUND));
    }

    public PostView create(PostRequest req, UUID authorId) {
        PostType type = PostType.valueOf(req.type());
        String slug = req.slug() != null && !req.slug().isBlank()
                ? req.slug()
                : uniqueSlug(req.title());
        return repo.insert(type, req.title(), slug, req.body(), req.youtubeUrl(), authorId);
    }

    public PostView update(UUID id, PostRequest req) {
        if (!repo.existsById(id)) throw new GymException(ErrorCode.POST_NOT_FOUND);
        PostType type = PostType.valueOf(req.type());
        String slug = req.slug() != null && !req.slug().isBlank()
                ? req.slug()
                : uniqueSlug(req.title());
        return repo.update(id, type, req.title(), slug, req.body(), req.youtubeUrl());
    }

    public void delete(UUID id) {
        if (!repo.existsById(id)) throw new GymException(ErrorCode.POST_NOT_FOUND);
        repo.delete(id);
    }

    private String uniqueSlug(String title) {
        String base = title.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-");
        if (!repo.existsBySlug(base)) return base;
        int i = 2;
        while (repo.existsBySlug(base + "-" + i)) i++;
        return base + "-" + i;
    }
}
