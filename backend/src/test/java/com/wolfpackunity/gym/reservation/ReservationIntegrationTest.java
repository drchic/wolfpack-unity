package com.wolfpackunity.gym.reservation;

import com.wolfpackunity.gym.auth.AuthService;
import com.wolfpackunity.gym.auth.dto.AuthResponse;
import com.wolfpackunity.gym.auth.dto.RegisterRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class ReservationIntegrationTest {

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
    @MockBean com.wolfpackunity.gym.email.EmailService emailService;

    private String token;
    private final LocalDate tomorrow = LocalDate.now().plusDays(1);

    @BeforeEach
    void setup() {
        AuthResponse auth = authService.register(new RegisterRequest("Tester", "tester@example.com", "pw"));
        token = auth.token();
    }

    @Test
    void getSlots_returnsAllHoursWithSpots() throws Exception {
        mvc.perform(get("/api/slots?date=" + tomorrow)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(24))
                .andExpect(jsonPath("$[0].spots.length()").value(10));
    }

    @Test
    void book_thenGetMyReservations_containsBooking() throws Exception {
        String body = String.format("""
            {"date":"%s","hour":10,"spotNumber":3}
            """, tomorrow);
        mvc.perform(post("/api/reservations")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.spotNumber").value(3));

        mvc.perform(get("/api/reservations/me")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void book_sameSpotTwice_returns409() throws Exception {
        String body = String.format("""
            {"date":"%s","hour":10,"spotNumber":5}
            """, tomorrow);
        mvc.perform(post("/api/reservations")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(body));
        mvc.perform(post("/api/reservations")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("SPOT_TAKEN"));
    }

    @Test
    void book_thirdInDay_returns409() throws Exception {
        for (int spot = 1; spot <= 2; spot++) {
            String body = String.format("""
                {"date":"%s","hour":%d,"spotNumber":1}
                """, tomorrow, 8 + spot);
            mvc.perform(post("/api/reservations")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON).content(body));
        }
        String body = String.format("""
            {"date":"%s","hour":14,"spotNumber":2}
            """, tomorrow);
        mvc.perform(post("/api/reservations")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("DAILY_LIMIT_REACHED"));
    }
}
