package com.wolfpackunity.gym.admin;

import com.wolfpackunity.gym.admin.dto.StatsView;
import com.wolfpackunity.gym.jooq.Tables;
import com.wolfpackunity.gym.jooq.enums.ReservationStatus;
import com.wolfpackunity.gym.jooq.enums.UserRole;
import com.wolfpackunity.gym.jooq.tables.records.ReservationsRecord;
import com.wolfpackunity.gym.jooq.tables.records.UsersRecord;
import com.wolfpackunity.gym.reservation.ReservationService;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class AdminService {

    private final DSLContext dsl;
    private final ReservationService reservationService;

    public AdminService(DSLContext dsl, ReservationService reservationService) {
        this.dsl = dsl;
        this.reservationService = reservationService;
    }

    public List<ReservationsRecord> getReservations(LocalDate date, UUID userId) {
        var cond = Tables.RESERVATIONS.STATUS.eq(ReservationStatus.ACTIVE);
        if (date != null) cond = cond.and(Tables.RESERVATIONS.DATE.eq(date));
        if (userId != null) cond = cond.and(Tables.RESERVATIONS.USER_ID.eq(userId));
        return dsl.selectFrom(Tables.RESERVATIONS).where(cond)
                .orderBy(Tables.RESERVATIONS.DATE, Tables.RESERVATIONS.HOUR).fetch();
    }

    public void cancelReservation(UUID reservationId) {
        reservationService.cancel(reservationId, null, true);
    }

    public List<UsersRecord> getUsers() {
        return dsl.selectFrom(Tables.USERS).orderBy(Tables.USERS.NAME).fetch();
    }

    public void updateRole(UUID userId, String role) {
        dsl.update(Tables.USERS)
                .set(Tables.USERS.ROLE, UserRole.valueOf(role))
                .where(Tables.USERS.ID.eq(userId))
                .execute();
    }

    public void deleteUser(UUID userId) {
        dsl.deleteFrom(Tables.USERS).where(Tables.USERS.ID.eq(userId)).execute();
    }

    public StatsView getStats() {
        var R = Tables.RESERVATIONS;
        var U = Tables.USERS;
        var active = R.STATUS.eq(ReservationStatus.ACTIVE);

        List<StatsView.DailyOccupancy> daily = dsl
                .select(R.DATE, DSL.count().as("cnt"))
                .from(R).where(active)
                .groupBy(R.DATE).orderBy(R.DATE.desc()).limit(30)
                .fetch(r -> new StatsView.DailyOccupancy(r.get(R.DATE), r.get("cnt", Integer.class)));

        List<StatsView.HourlyOccupancy> hourly = dsl
                .select(R.HOUR, DSL.count().as("cnt"))
                .from(R).where(active)
                .groupBy(R.HOUR).orderBy(DSL.count().desc()).limit(10)
                .fetch(r -> new StatsView.HourlyOccupancy(r.get(R.HOUR), r.get("cnt", Integer.class)));

        List<StatsView.TopUser> top = dsl
                .select(U.NAME, U.EMAIL, DSL.count().as("cnt"))
                .from(R).join(U).on(R.USER_ID.eq(U.ID))
                .where(active)
                .groupBy(U.ID, U.NAME, U.EMAIL)
                .orderBy(DSL.count().desc()).limit(10)
                .fetch(r -> new StatsView.TopUser(r.get(U.NAME), r.get(U.EMAIL), r.get("cnt", Integer.class)));

        return new StatsView(daily, hourly, top);
    }
}
