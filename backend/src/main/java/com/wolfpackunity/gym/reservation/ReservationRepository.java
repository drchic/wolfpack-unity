package com.wolfpackunity.gym.reservation;

import com.wolfpackunity.gym.jooq.Tables;
import com.wolfpackunity.gym.jooq.enums.ReservationStatus;
import com.wolfpackunity.gym.jooq.tables.records.ReservationsRecord;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class ReservationRepository {

    private final DSLContext dsl;

    public ReservationRepository(DSLContext dsl) { this.dsl = dsl; }

    public List<ReservationsRecord> findActiveByDate(LocalDate date) {
        return dsl.selectFrom(Tables.RESERVATIONS)
                .where(Tables.RESERVATIONS.DATE.eq(date))
                .and(Tables.RESERVATIONS.STATUS.eq(ReservationStatus.ACTIVE))
                .fetch();
    }

    public int countActiveByUserAndDate(UUID userId, LocalDate date) {
        return dsl.fetchCount(Tables.RESERVATIONS,
                Tables.RESERVATIONS.USER_ID.eq(userId)
                        .and(Tables.RESERVATIONS.DATE.eq(date))
                        .and(Tables.RESERVATIONS.STATUS.eq(ReservationStatus.ACTIVE)));
    }

    public List<ReservationsRecord> findUpcomingByUser(UUID userId) {
        return dsl.selectFrom(Tables.RESERVATIONS)
                .where(Tables.RESERVATIONS.USER_ID.eq(userId))
                .and(Tables.RESERVATIONS.DATE.greaterOrEqual(LocalDate.now()))
                .and(Tables.RESERVATIONS.STATUS.eq(ReservationStatus.ACTIVE))
                .orderBy(Tables.RESERVATIONS.DATE, Tables.RESERVATIONS.HOUR)
                .fetch();
    }

    public ReservationsRecord insert(UUID userId, LocalDate date, int hour, int spotNumber) {
        return dsl.insertInto(Tables.RESERVATIONS)
                .set(Tables.RESERVATIONS.USER_ID, userId)
                .set(Tables.RESERVATIONS.DATE, date)
                .set(Tables.RESERVATIONS.HOUR, (short) hour)
                .set(Tables.RESERVATIONS.SPOT_NUMBER, (short) spotNumber)
                .set(Tables.RESERVATIONS.STATUS, ReservationStatus.ACTIVE)
                .returning()
                .fetchOne();
    }

    public Optional<ReservationsRecord> findById(UUID id) {
        return dsl.selectFrom(Tables.RESERVATIONS)
                .where(Tables.RESERVATIONS.ID.eq(id))
                .fetchOptional();
    }

    public void cancel(UUID id) {
        dsl.update(Tables.RESERVATIONS)
                .set(Tables.RESERVATIONS.STATUS, ReservationStatus.CANCELLED)
                .where(Tables.RESERVATIONS.ID.eq(id))
                .execute();
    }
}
