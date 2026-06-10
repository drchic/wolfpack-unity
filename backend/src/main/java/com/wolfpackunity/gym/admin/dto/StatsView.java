package com.wolfpackunity.gym.admin.dto;

import java.time.LocalDate;
import java.util.List;

public record StatsView(
    List<DailyOccupancy> dailyOccupancy,
    List<HourlyOccupancy> busiestHours,
    List<TopUser> topUsers
) {
    public record DailyOccupancy(LocalDate date, int bookedSpots) {}
    public record HourlyOccupancy(int hour, int bookedSpots) {}
    public record TopUser(String name, String email, int totalBookings) {}
}
