package com.wolfpackunity.gym.post;

import com.wolfpackunity.gym.exception.ErrorCode;
import com.wolfpackunity.gym.exception.GymException;
import com.wolfpackunity.gym.jooq.enums.PostType;
import com.wolfpackunity.gym.post.dto.PostRequest;
import com.wolfpackunity.gym.post.dto.PostView;
import com.wolfpackunity.gym.post.dto.PostsPage;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class PostService {

    private final PostRepository repo;

    public PostService(PostRepository repo) { this.repo = repo; }

    public PostsPage list(String type, int page, int size) {
        PostType postType = null;
        if (type != null) {
            try {
                postType = PostType.valueOf(type);
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown post type: " + type);
            }
        }
        List<PostView> content = repo.findAll(postType, page, size);
        long total = repo.count(postType);
        return new PostsPage(content, total, page, size);
    }

    public PostView get(String slug) {
        return repo.findBySlug(slug)
                .orElseThrow(() -> new GymException(ErrorCode.POST_NOT_FOUND));
    }

    public PostView create(PostRequest req, UUID authorId) {
        PostType type;
        try {
            type = PostType.valueOf(req.type());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown post type: " + req.type());
        }
        String slug = req.slug() != null && !req.slug().isBlank()
                ? req.slug()
                : uniqueSlug(req.title());
        return repo.insert(type, req.title(), slug, req.body(), req.youtubeUrl(), authorId);
    }

    public PostView update(UUID id, PostRequest req) {
        // Issue 1 + Issue 3: fetch existing post first — provides atomic 404 and gives us the
        // current slug so a PUT that omits the slug field does not regenerate it.
        PostView existing = repo.findById(id)
                .orElseThrow(() -> new GymException(ErrorCode.POST_NOT_FOUND));
        PostType type;
        try {
            type = PostType.valueOf(req.type());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown post type: " + req.type());
        }
        // Preserve the existing slug when the caller did not explicitly supply one.
        String slug = (req.slug() != null && !req.slug().isBlank())
                ? req.slug()
                : existing.slug();
        return repo.update(id, type, req.title(), slug, req.body(), req.youtubeUrl());
    }

    public void delete(UUID id) {
        // Issue 3: remove TOCTOU pre-check; rely on rows-affected count instead.
        int rows = repo.delete(id);
        if (rows == 0) throw new GymException(ErrorCode.POST_NOT_FOUND);
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
