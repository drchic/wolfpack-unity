package com.wolfpackunity.gym.reservation;

import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.time.LocalDateTime;
import static org.assertj.core.api.Assertions.assertThat;

class CancellationPolicyTest {

    @Test
    void morningSlot_06to12_beforeDeadline_isAllowed() {
        // hour=7, date=June10, now=June9 19:59 — before 20:00 deadline previous day
        assertThat(CancellationPolicy.isAllowed(
                LocalDate.of(2026, 6, 10), 7,
                LocalDateTime.of(2026, 6, 9, 19, 59))).isTrue();
    }

    @Test
    void morningSlot_06to12_atDeadline_isDenied() {
        // now=June9 20:00 — exactly at deadline, not allowed
        assertThat(CancellationPolicy.isAllowed(
                LocalDate.of(2026, 6, 10), 7,
                LocalDateTime.of(2026, 6, 9, 20, 0))).isFalse();
    }

    @Test
    void afternoonSlot_12to21_moreThan4hBefore_isAllowed() {
        // hour=14, deadline=10:00, now=09:59
        assertThat(CancellationPolicy.isAllowed(
                LocalDate.of(2026, 6, 10), 14,
                LocalDateTime.of(2026, 6, 10, 9, 59))).isTrue();
    }

    @Test
    void afternoonSlot_12to21_exactly4hBefore_isDenied() {
        assertThat(CancellationPolicy.isAllowed(
                LocalDate.of(2026, 6, 10), 14,
                LocalDateTime.of(2026, 6, 10, 10, 0))).isFalse();
    }

    @Test
    void afternoonSlot_12to21_after4hBefore_isDenied() {
        assertThat(CancellationPolicy.isAllowed(
                LocalDate.of(2026, 6, 10), 14,
                LocalDateTime.of(2026, 6, 10, 11, 0))).isFalse();
    }

    @Test
    void nightSlot_21to06_moreThan1hBefore_isAllowed() {
        // hour=22, deadline=21:00, now=20:59
        assertThat(CancellationPolicy.isAllowed(
                LocalDate.of(2026, 6, 10), 22,
                LocalDateTime.of(2026, 6, 10, 20, 59))).isTrue();
    }

    @Test
    void nightSlot_21to06_exactly1hBefore_isDenied() {
        // hour=22, deadline=21:00, now=21:00
        assertThat(CancellationPolicy.isAllowed(
                LocalDate.of(2026, 6, 10), 22,
                LocalDateTime.of(2026, 6, 10, 21, 0))).isFalse();
    }

    @Test
    void earlyMorningSlot_00to06_moreThan1hBefore_isAllowed() {
        // hour=3, deadline=02:00, now=01:59
        assertThat(CancellationPolicy.isAllowed(
                LocalDate.of(2026, 6, 10), 3,
                LocalDateTime.of(2026, 6, 10, 1, 59))).isTrue();
    }

    @Test
    void earlyMorningSlot_00to06_exactly1hBefore_isDenied() {
        // hour=3, deadline=02:00, now=02:00
        assertThat(CancellationPolicy.isAllowed(
                LocalDate.of(2026, 6, 10), 3,
                LocalDateTime.of(2026, 6, 10, 2, 0))).isFalse();
    }

    @Test
    void nightSlot_23_beforeDeadline_isAllowed() {
        // hour=23, deadline=22:00, now=21:59
        assertThat(CancellationPolicy.isAllowed(
                LocalDate.of(2026, 6, 10), 23,
                LocalDateTime.of(2026, 6, 10, 21, 59))).isTrue();
    }

    @Test
    void nightSlot_23_atDeadline_isDenied() {
        // hour=23, deadline=22:00, now=22:00
        assertThat(CancellationPolicy.isAllowed(
                LocalDate.of(2026, 6, 10), 23,
                LocalDateTime.of(2026, 6, 10, 22, 0))).isFalse();
    }
}
