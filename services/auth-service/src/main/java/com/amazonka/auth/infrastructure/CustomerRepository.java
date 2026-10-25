package com.amazonka.auth.infrastructure;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.amazonka.auth.domain.Customer;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    Optional<Customer> findByTenantIdAndEmail(
            UUID tenantId,
            String email);

    Optional<Customer> findByTenantIdAndEmailAndStatus(
            UUID tenantId,
            String email,
            Short status);

    boolean existsByTenantIdAndEmail(UUID tenantId, String email);
}
