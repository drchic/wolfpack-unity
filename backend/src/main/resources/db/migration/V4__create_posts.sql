CREATE TYPE post_type AS ENUM ('NEWS', 'BLOG', 'VLOG', 'ANNOUNCEMENT');

CREATE TABLE posts (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    type          post_type    NOT NULL,
    title         VARCHAR(255) NOT NULL,
    slug          VARCHAR(255) NOT NULL UNIQUE,
    body          TEXT,
    youtube_url   VARCHAR(500),
    author_id     UUID         NOT NULL REFERENCES users(id),
    published_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
