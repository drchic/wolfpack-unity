package com.wolfpackunity.gym.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    SLOT_FULL(HttpStatus.CONFLICT, "All 10 spots are taken for this slot."),
    SPOT_TAKEN(HttpStatus.CONFLICT, "This spot is already booked."),
    DAILY_LIMIT_REACHED(HttpStatus.CONFLICT, "You already have 2 reservations on this day."),
    CANCELLATION_DEADLINE_PASSED(HttpStatus.BAD_REQUEST, "The cancellation deadline has passed."),
    PAST_SLOT(HttpStatus.BAD_REQUEST, "Cannot book a slot that has already started."),
    RESERVATION_NOT_FOUND(HttpStatus.NOT_FOUND, "Reservation not found."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "User not found."),
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "Post not found."),
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "An account with this email already exists.");

    public final HttpStatus status;
    public final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
