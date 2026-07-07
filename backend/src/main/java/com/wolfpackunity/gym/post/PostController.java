package com.wolfpackunity.gym.post;

import com.wolfpackunity.gym.post.dto.PostRequest;
import com.wolfpackunity.gym.post.dto.PostView;
import com.wolfpackunity.gym.post.dto.PostsPage;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService service;

    public PostController(PostService service) { this.service = service; }

    @GetMapping
    public PostsPage list(
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int effectiveSize = Math.min(size, 100);
        return service.list(type, page, effectiveSize);
    }

    @GetMapping("/{slug}")
    public PostView get(@PathVariable String slug) {
        return service.get(slug);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostView create(@RequestBody @Valid PostRequest req, Authentication auth) {
        return service.create(req, UUID.fromString(auth.getName()));
    }

    @PutMapping("/{id}")
    public PostView update(@PathVariable UUID id, @RequestBody @Valid PostRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
