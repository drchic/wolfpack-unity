package com.wolfpackunity.gym.exception;

public class GymException extends RuntimeException {
    public final ErrorCode code;

    public GymException(ErrorCode code) {
        super(code.message);
        this.code = code;
    }
}
