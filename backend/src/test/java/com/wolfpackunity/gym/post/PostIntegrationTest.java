package com.wolfpackunity.gym.post;

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
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class PostIntegrationTest {

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
        dsl.deleteFrom(Tables.POSTS).execute();
        dsl.deleteFrom(Tables.USERS).execute();
        userToken = authService.register(new RegisterRequest("User", "user@example.com", "pw")).token();
        authService.register(new RegisterRequest("Admin", "admin@example.com", "pw"));
        dsl.update(Tables.USERS).set(Tables.USERS.ROLE, UserRole.ADMIN)
                .where(Tables.USERS.EMAIL.eq("admin@example.com")).execute();
        adminToken = authService.login(new LoginRequest("admin@example.com", "pw")).token();
    }

    @Test
    void getPublicPosts_noAuth_returns200() throws Exception {
        mvc.perform(get("/api/posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void createPost_withoutAuth_returns3xxRedirect() throws Exception {
        mvc.perform(post("/api/posts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"type":"NEWS","title":"Test Post","body":"Hello"}
                    """))
                .andExpect(status().is3xxRedirection());
    }

    @Test
    void createPost_withAdminAuth_returns201() throws Exception {
        mvc.perform(post("/api/posts")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"type":"NEWS","title":"Breaking News","body":"Content here"}
                    """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug").value("breaking-news"))
                .andExpect(jsonPath("$.type").value("NEWS"));
    }

    @Test
    void getPostBySlug_returns200() throws Exception {
        mvc.perform(post("/api/posts")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"type":"BLOG","title":"My Blog Post","body":"Body text"}
                    """));
        mvc.perform(get("/api/posts/my-blog-post"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("My Blog Post"));
    }

    @Test
    void deletePost_withAdminAuth_returns204() throws Exception {
        String response = mvc.perform(post("/api/posts")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"type":"ANNOUNCEMENT","title":"Delete Me","body":"bye"}
                    """))
                .andReturn().getResponse().getContentAsString();
        String id = com.fasterxml.jackson.databind.json.JsonMapper.builder().build()
                .readTree(response).get("id").asText();
        mvc.perform(delete("/api/posts/" + id)
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());
    }

    @Test
    void writeEndpoints_withUserRole_return403() throws Exception {
        String fakeId = java.util.UUID.randomUUID().toString();

        mvc.perform(post("/api/posts")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"type":"NEWS","title":"Should Fail","body":"no"}
                    """))
                .andExpect(status().isForbidden());

        mvc.perform(put("/api/posts/" + fakeId)
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"type":"NEWS","title":"Should Fail","body":"no"}
                    """))
                .andExpect(status().isForbidden());

        mvc.perform(delete("/api/posts/" + fakeId)
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }
}
