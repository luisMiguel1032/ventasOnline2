package com.amazonka.common.security;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

/**
 * Emite los JWT del e-commerce. Claims:
 *  - sub          -> id del usuario o del cliente
 *  - tenantId     -> tienda/empresa
 *  - accountType  -> ADMIN | CUSTOMER
 *  - login/email  -> identificador visible
 *  - name         -> nombre para mostrar
 */
@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final long expirationSeconds;
    private final String issuer;

    public JwtService(
            JwtEncoder jwtEncoder,
            @Value("${app.jwt.expiration-seconds:86400}") long expirationSeconds,
            @Value("${app.jwt.issuer:amazonka}") String issuer) {

        this.jwtEncoder = jwtEncoder;
        this.expirationSeconds = expirationSeconds;
        this.issuer = issuer;
    }

    public String generarToken(
            UUID subjectId,
            UUID tenantId,
            String accountType,
            String login,
            String name) {

        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .subject(subjectId.toString())
                .issuedAt(now)
                .expiresAt(now.plusSeconds(expirationSeconds))
                .claim("tenantId", tenantId.toString())
                .claim("accountType", accountType)
                .claim("login", login)
                .claim("name", name)
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();

        return jwtEncoder.encode(
                JwtEncoderParameters.from(header, claims)
        ).getTokenValue();
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }
}
