package com.wolfpackunity.gym.reservation.dto;

import java.time.LocalDate;
import java.util.UUID;

public record ReservationView(UUID id, LocalDate date, int hour, int spotNumber, String status) {}
