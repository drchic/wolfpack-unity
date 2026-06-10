package com.wolfpackunity.gym.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(GymException.class)
    public ResponseEntity<Map<String, String>> handleGym(GymException ex) {
        return ResponseEntity.status(ex.code.status)
                .body(Map.of("error", ex.code.name(), "message", ex.code.message));
    }
}
