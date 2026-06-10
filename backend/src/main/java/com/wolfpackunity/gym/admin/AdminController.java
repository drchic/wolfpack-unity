package com.wolfpackunity.gym.admin;

import com.wolfpackunity.gym.admin.dto.RoleUpdateRequest;
import com.wolfpackunity.gym.admin.dto.StatsView;
import com.wolfpackunity.gym.jooq.tables.records.ReservationsRecord;
import com.wolfpackunity.gym.jooq.tables.records.UsersRecord;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService service;

    public AdminController(AdminService service) { this.service = service; }

    @GetMapping("/reservations")
    public List<ReservationsRecord> reservations(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) UUID userId) {
        return service.getReservations(date, userId);
    }

    @DeleteMapping("/reservations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelReservation(@PathVariable UUID id) {
        service.cancelReservation(id);
    }

    @GetMapping("/users")
    public List<UsersRecord> users() {
        return service.getUsers();
    }

    @PatchMapping("/users/{id}/role")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateRole(@PathVariable UUID id, @RequestBody RoleUpdateRequest req) {
        service.updateRole(id, req.role());
    }

    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable UUID id) {
        service.deleteUser(id);
    }

    @GetMapping("/stats")
    public StatsView stats() {
        return service.getStats();
    }
}
