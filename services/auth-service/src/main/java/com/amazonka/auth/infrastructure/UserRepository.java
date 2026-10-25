package com.amazonka.auth.infrastructure;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.amazonka.auth.domain.User;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByTenantIdAndLoginAndDeletedAtIsNull(
            UUID tenantId,
            String login);
}
