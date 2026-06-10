package com.wolfpackunity.gym.reservation;

import com.wolfpackunity.gym.reservation.dto.BookRequest;
import com.wolfpackunity.gym.reservation.dto.ReservationView;
import com.wolfpackunity.gym.reservation.dto.SlotView;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ReservationController {

    private final ReservationService service;

    public ReservationController(ReservationService service) { this.service = service; }

    @GetMapping("/slots")
    public List<SlotView> getSlots(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication auth) {
        return service.getSlots(date, UUID.fromString(auth.getName()));
    }

    @PostMapping("/reservations")
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationView book(@RequestBody BookRequest req, Authentication auth) {
        return service.book(req, UUID.fromString(auth.getName()));
    }

    @DeleteMapping("/reservations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable UUID id, Authentication auth) {
        service.cancel(id, UUID.fromString(auth.getName()), false);
    }

    @GetMapping("/reservations/me")
    public List<ReservationView> myReservations(Authentication auth) {
        return service.getMyReservations(UUID.fromString(auth.getName()));
    }
}
