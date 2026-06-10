package com.wolfpackunity.gym.reservation;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class CancellationPolicy {

    private CancellationPolicy() {}

    public static boolean isAllowed(LocalDate bookingDate, int hour, LocalDateTime now) {
        LocalDateTime deadline;

        if (hour >= 6 && hour < 12) {
            // Morning (06:00-12:00): cancel before 20:00 previous day
            deadline = bookingDate.minusDays(1).atTime(20, 0);
        } else if (hour >= 12 && hour < 21) {
            // Afternoon (12:00-21:00): cancel 4 hours before
            deadline = bookingDate.atTime(hour, 0).minusHours(4);
        } else {
            // Night (21:00-06:00): cancel 1 hour before
            deadline = bookingDate.atTime(hour, 0).minusHours(1);
        }

        return now.isBefore(deadline);
    }
}
