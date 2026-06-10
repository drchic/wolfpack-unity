package com.wolfpackunity.gym.config;

import com.wolfpackunity.gym.jooq.enums.UserRole;
import com.wolfpackunity.gym.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AdminSeeder {

    @Bean
    public ApplicationRunner seedAdmin(UserRepository users,
                                       @Value("${app.admin.email}") String adminEmail) {
        return args -> users.findByEmail(adminEmail).ifPresent(user -> {
            if (user.getRole() != UserRole.ADMIN) {
                users.updateRole(user.getId(), UserRole.ADMIN);
            }
        });
    }
}
