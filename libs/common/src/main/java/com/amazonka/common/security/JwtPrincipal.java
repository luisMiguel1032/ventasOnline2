package com.amazonka.common.security;

import java.util.UUID;

import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Datos del token ya validado, listos para usar en cualquier servicio.
 */
public record JwtPrincipal(
        UUID subjectId,
        UUID tenantId,
        String accountType,
        String login,
        String name
) {

    public static JwtPrincipal from(Jwt jwt) {
        String tenantClaim = jwt.getClaimAsString("tenantId");

        return new JwtPrincipal(
                UUID.fromString(jwt.getSubject()),
                tenantClaim == null ? null : UUID.fromString(tenantClaim),
                jwt.getClaimAsString("accountType"),
                jwt.getClaimAsString("login"),
                jwt.getClaimAsString("name")
        );
    }

    public boolean isAdmin() {
        return "ADMIN".equals(accountType);
    }

    public boolean isCustomer() {
        return "CUSTOMER".equals(accountType);
    }
}
