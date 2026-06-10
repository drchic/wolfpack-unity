package com.wolfpackunity.gym.reservation;

import com.wolfpackunity.gym.email.EmailService;
import com.wolfpackunity.gym.exception.ErrorCode;
import com.wolfpackunity.gym.exception.GymException;
import com.wolfpackunity.gym.jooq.tables.records.ReservationsRecord;
import com.wolfpackunity.gym.jooq.tables.records.UsersRecord;
import com.wolfpackunity.gym.reservation.dto.BookRequest;
import com.wolfpackunity.gym.reservation.dto.ReservationView;
import com.wolfpackunity.gym.reservation.dto.SlotView;
import com.wolfpackunity.gym.user.UserRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ReservationService {

    private final ReservationRepository repo;
    private final UserRepository users;
    private final EmailService email;

    public ReservationService(ReservationRepository repo, UserRepository users, EmailService email) {
        this.repo = repo;
        this.users = users;
        this.email = email;
    }

    public List<SlotView> getSlots(LocalDate date, UUID currentUserId) {
        List<ReservationsRecord> active = repo.findActiveByDate(date);
        Map<Short, Map<Short, ReservationsRecord>> byHourAndSpot = active.stream()
                .collect(Collectors.groupingBy(ReservationsRecord::getHour,
                        Collectors.toMap(ReservationsRecord::getSpotNumber, r -> r)));

        List<SlotView> slots = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            List<SlotView.SpotView> spots = new ArrayList<>();
            for (int s = 1; s <= 10; s++) {
                ReservationsRecord r = byHourAndSpot.getOrDefault((short) h, Map.of()).get((short) s);
                if (r == null) {
                    spots.add(new SlotView.SpotView(s, true, null, false));
                } else {
                    spots.add(new SlotView.SpotView(s, false, r.getId(), r.getUserId().equals(currentUserId)));
                }
            }
            slots.add(new SlotView(h, spots));
        }
        return slots;
    }

    public ReservationView book(BookRequest req, UUID userId) {
        if (req.date().isBefore(LocalDate.now()) ||
                (req.date().equals(LocalDate.now()) && req.hour() <= LocalDateTime.now().getHour())) {
            throw new GymException(ErrorCode.PAST_SLOT);
        }
        if (repo.countActiveByUserAndDate(userId, req.date()) >= 2) {
            throw new GymException(ErrorCode.DAILY_LIMIT_REACHED);
        }
        try {
            ReservationsRecord r = repo.insert(userId, req.date(), req.hour(), req.spotNumber());
            UsersRecord user = users.findById(userId).orElseThrow();
            email.sendBookingConfirmation(user.getEmail(), user.getName(), r.getDate(), r.getHour(), r.getSpotNumber());
            return toView(r);
        } catch (DuplicateKeyException e) {
            throw new GymException(ErrorCode.SPOT_TAKEN);
        }
    }

    public void cancel(UUID reservationId, UUID userId, boolean isAdmin) {
        ReservationsRecord r = repo.findById(reservationId)
                .orElseThrow(() -> new GymException(ErrorCode.RESERVATION_NOT_FOUND));
        if (!isAdmin && !r.getUserId().equals(userId)) {
            throw new GymException(ErrorCode.RESERVATION_NOT_FOUND);
        }
        if (!isAdmin && !CancellationPolicy.isAllowed(r.getDate(), r.getHour(), LocalDateTime.now())) {
            throw new GymException(ErrorCode.CANCELLATION_DEADLINE_PASSED);
        }
        repo.cancel(reservationId);
        UsersRecord owner = users.findById(r.getUserId()).orElseThrow();
        email.sendCancellationNotice(owner.getEmail(), owner.getName(), r.getDate(), r.getHour(), r.getSpotNumber());
    }

    public List<ReservationView> getMyReservations(UUID userId) {
        return repo.findUpcomingByUser(userId).stream().map(this::toView).toList();
    }

    private ReservationView toView(ReservationsRecord r) {
        return new ReservationView(r.getId(), r.getDate(), r.getHour(), r.getSpotNumber(), r.getStatus().getLiteral());
    }
}
