package com.wolfpackunity.gym.user;

import com.wolfpackunity.gym.jooq.Tables;
import com.wolfpackunity.gym.jooq.enums.UserRole;
import com.wolfpackunity.gym.jooq.tables.records.UsersRecord;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public class UserRepository {

    private final DSLContext dsl;

    public UserRepository(DSLContext dsl) { this.dsl = dsl; }

    public Optional<UsersRecord> findByEmail(String email) {
        return dsl.selectFrom(Tables.USERS)
                .where(Tables.USERS.EMAIL.eq(email))
                .fetchOptional();
    }

    public Optional<UsersRecord> findById(UUID id) {
        return dsl.selectFrom(Tables.USERS)
                .where(Tables.USERS.ID.eq(id))
                .fetchOptional();
    }

    public UsersRecord insert(String email, String name, String passwordHash, String googleId) {
        return dsl.insertInto(Tables.USERS)
                .set(Tables.USERS.EMAIL, email)
                .set(Tables.USERS.NAME, name)
                .set(Tables.USERS.PASSWORD_HASH, passwordHash)
                .set(Tables.USERS.GOOGLE_ID, googleId)
                .set(Tables.USERS.ROLE, UserRole.USER)
                .returning()
                .fetchOne();
    }

    public void updateRole(UUID id, UserRole role) {
        dsl.update(Tables.USERS)
                .set(Tables.USERS.ROLE, role)
                .where(Tables.USERS.ID.eq(id))
                .execute();
    }

    public void delete(UUID id) {
        dsl.deleteFrom(Tables.USERS).where(Tables.USERS.ID.eq(id)).execute();
    }
}
