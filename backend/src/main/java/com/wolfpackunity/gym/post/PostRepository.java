package com.wolfpackunity.gym.post;

import com.wolfpackunity.gym.jooq.Tables;
import com.wolfpackunity.gym.jooq.enums.PostType;
import com.wolfpackunity.gym.post.dto.PostView;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class PostRepository {

    private final DSLContext dsl;

    public PostRepository(DSLContext dsl) { this.dsl = dsl; }

    public List<PostView> findAll(PostType type, int page, int size) {
        Condition condition = type != null ? Tables.POSTS.TYPE.eq(type) : DSL.trueCondition();
        return dsl.select(
                        Tables.POSTS.ID, Tables.POSTS.TYPE, Tables.POSTS.TITLE, Tables.POSTS.SLUG,
                        Tables.POSTS.BODY, Tables.POSTS.YOUTUBE_URL, Tables.POSTS.PUBLISHED_AT,
                        Tables.USERS.NAME)
                .from(Tables.POSTS)
                .join(Tables.USERS).on(Tables.POSTS.AUTHOR_ID.eq(Tables.USERS.ID))
                .where(condition)
                .orderBy(Tables.POSTS.PUBLISHED_AT.desc())
                .limit(size).offset((long) page * size)
                .fetch(r -> new PostView(
                        r.get(Tables.POSTS.ID),
                        r.get(Tables.POSTS.TYPE).getLiteral(),
                        r.get(Tables.POSTS.TITLE),
                        r.get(Tables.POSTS.SLUG),
                        r.get(Tables.POSTS.BODY),
                        r.get(Tables.POSTS.YOUTUBE_URL),
                        r.get(Tables.USERS.NAME),
                        r.get(Tables.POSTS.PUBLISHED_AT)));
    }

    public long count(PostType type) {
        Condition condition = type != null ? Tables.POSTS.TYPE.eq(type) : DSL.trueCondition();
        return dsl.fetchCount(Tables.POSTS, condition);
    }

    public Optional<PostView> findBySlug(String slug) {
        return dsl.select(
                        Tables.POSTS.ID, Tables.POSTS.TYPE, Tables.POSTS.TITLE, Tables.POSTS.SLUG,
                        Tables.POSTS.BODY, Tables.POSTS.YOUTUBE_URL, Tables.POSTS.PUBLISHED_AT,
                        Tables.USERS.NAME)
                .from(Tables.POSTS)
                .join(Tables.USERS).on(Tables.POSTS.AUTHOR_ID.eq(Tables.USERS.ID))
                .where(Tables.POSTS.SLUG.eq(slug))
                .fetchOptional(r -> new PostView(
                        r.get(Tables.POSTS.ID),
                        r.get(Tables.POSTS.TYPE).getLiteral(),
                        r.get(Tables.POSTS.TITLE),
                        r.get(Tables.POSTS.SLUG),
                        r.get(Tables.POSTS.BODY),
                        r.get(Tables.POSTS.YOUTUBE_URL),
                        r.get(Tables.USERS.NAME),
                        r.get(Tables.POSTS.PUBLISHED_AT)));
    }

    public PostView insert(PostType type, String title, String slug, String body,
                           String youtubeUrl, UUID authorId) {
        dsl.insertInto(Tables.POSTS)
                .set(Tables.POSTS.TYPE, type)
                .set(Tables.POSTS.TITLE, title)
                .set(Tables.POSTS.SLUG, slug)
                .set(Tables.POSTS.BODY, body)
                .set(Tables.POSTS.YOUTUBE_URL, youtubeUrl)
                .set(Tables.POSTS.AUTHOR_ID, authorId)
                .returning(Tables.POSTS.ID)
                .fetchOne(Tables.POSTS.ID);
        return findBySlug(slug).orElseThrow();
    }

    public PostView update(UUID id, PostType type, String title, String slug,
                           String body, String youtubeUrl) {
        dsl.update(Tables.POSTS)
                .set(Tables.POSTS.TYPE, type)
                .set(Tables.POSTS.TITLE, title)
                .set(Tables.POSTS.SLUG, slug)
                .set(Tables.POSTS.BODY, body)
                .set(Tables.POSTS.YOUTUBE_URL, youtubeUrl)
                .where(Tables.POSTS.ID.eq(id))
                .execute();
        return findBySlug(slug).orElseThrow();
    }

    public Optional<PostView> findById(UUID id) {
        return dsl.select(
                        Tables.POSTS.ID, Tables.POSTS.TYPE, Tables.POSTS.TITLE, Tables.POSTS.SLUG,
                        Tables.POSTS.BODY, Tables.POSTS.YOUTUBE_URL, Tables.POSTS.PUBLISHED_AT,
                        Tables.USERS.NAME)
                .from(Tables.POSTS)
                .join(Tables.USERS).on(Tables.POSTS.AUTHOR_ID.eq(Tables.USERS.ID))
                .where(Tables.POSTS.ID.eq(id))
                .fetchOptional(r -> new PostView(
                        r.get(Tables.POSTS.ID),
                        r.get(Tables.POSTS.TYPE).getLiteral(),
                        r.get(Tables.POSTS.TITLE),
                        r.get(Tables.POSTS.SLUG),
                        r.get(Tables.POSTS.BODY),
                        r.get(Tables.POSTS.YOUTUBE_URL),
                        r.get(Tables.USERS.NAME),
                        r.get(Tables.POSTS.PUBLISHED_AT)));
    }

    public int delete(UUID id) {
        return dsl.deleteFrom(Tables.POSTS).where(Tables.POSTS.ID.eq(id)).execute();
    }

    public boolean existsBySlug(String slug) {
        return dsl.fetchExists(Tables.POSTS, Tables.POSTS.SLUG.eq(slug));
    }
}
