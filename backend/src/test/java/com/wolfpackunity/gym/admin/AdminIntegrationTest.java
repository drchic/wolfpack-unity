package com.wolfpackunity.gym.admin;

import com.wolfpackunity.gym.auth.AuthService;
import com.wolfpackunity.gym.auth.dto.LoginRequest;
import com.wolfpackunity.gym.auth.dto.RegisterRequest;
import com.wolfpackunity.gym.jooq.Tables;
import com.wolfpackunity.gym.jooq.enums.UserRole;
import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AdminIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18.4");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", postgres::getJdbcUrl);
        r.add("spring.datasource.username", postgres::getUsername);
        r.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired MockMvc mvc;
    @Autowired AuthService authService;
    @Autowired DSLContext dsl;
    @MockBean com.wolfpackunity.gym.email.EmailService emailService;

    private String adminToken;
    private String userToken;

    @BeforeEach
    void setup() {
        userToken = authService.register(new RegisterRequest("User", "user@example.com", "pw")).token();
        authService.register(new RegisterRequest("Admin", "admin@example.com", "pw"));
        dsl.update(Tables.USERS).set(Tables.USERS.ROLE, UserRole.ADMIN)
                .where(Tables.USERS.EMAIL.eq("admin@example.com")).execute();
        adminToken = authService.login(new LoginRequest("admin@example.com", "pw")).token();
    }

    @Test
    void adminCanListUsers() throws Exception {
        mvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void userCannotAccessAdmin() throws Exception {
        mvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanViewStats() throws Exception {
        mvc.perform(get("/api/admin/stats").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dailyOccupancy").isArray());
    }
}
