package com.wolfpackunity.gym.reservation.dto;

import java.time.LocalDate;

public record BookRequest(LocalDate date, int hour, int spotNumber) {}
