package com.wolfpackunity.gym.reservation.dto;

import java.util.List;
import java.util.UUID;

public record SlotView(int hour, List<SpotView> spots) {
    public record SpotView(int number, boolean available, UUID reservationId, boolean mine) {}
}
