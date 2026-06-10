CREATE TABLE reservations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date        DATE NOT NULL,
    hour        SMALLINT NOT NULL CHECK (hour BETWEEN 0 AND 23),
    spot_number SMALLINT NOT NULL CHECK (spot_number BETWEEN 1 AND 10),
    status      reservation_status NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_active_spot
    ON reservations (date, hour, spot_number)
    WHERE status = 'ACTIVE';

CREATE INDEX idx_reservations_user_date ON reservations (user_id, date);
