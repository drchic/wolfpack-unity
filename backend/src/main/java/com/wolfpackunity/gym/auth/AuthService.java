package com.wolfpackunity.gym.auth;

import com.wolfpackunity.gym.auth.dto.AuthResponse;
import com.wolfpackunity.gym.auth.dto.LoginRequest;
import com.wolfpackunity.gym.auth.dto.RegisterRequest;
import com.wolfpackunity.gym.exception.ErrorCode;
import com.wolfpackunity.gym.exception.GymException;
import com.wolfpackunity.gym.jooq.tables.records.UsersRecord;
import com.wolfpackunity.gym.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtUtil jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtUtil jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    public AuthResponse register(RegisterRequest req) {
        if (users.findByEmail(req.email()).isPresent()) {
            throw new GymException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        UsersRecord user = users.insert(req.email(), req.name(), encoder.encode(req.password()), null);
        return new AuthResponse(jwt.generate(user.getId(), user.getEmail(), user.getRole().getLiteral()));
    }

    public AuthResponse login(LoginRequest req) {
        UsersRecord user = users.findByEmail(req.email())
                .orElseThrow(() -> new GymException(ErrorCode.USER_NOT_FOUND));
        if (user.getPasswordHash() == null || !encoder.matches(req.password(), user.getPasswordHash())) {
            throw new GymException(ErrorCode.USER_NOT_FOUND);
        }
        return new AuthResponse(jwt.generate(user.getId(), user.getEmail(), user.getRole().getLiteral()));
    }

    public AuthResponse upsertGoogleUser(String email, String name, String googleId) {
        UsersRecord user = users.findByEmail(email).orElseGet(
                () -> users.insert(email, name, null, googleId));
        return new AuthResponse(jwt.generate(user.getId(), user.getEmail(), user.getRole().getLiteral()));
    }
}
