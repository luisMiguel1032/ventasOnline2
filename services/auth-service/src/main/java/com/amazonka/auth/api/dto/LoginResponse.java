package com.amazonka.auth.api.dto;

import java.util.UUID;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UUID subjectId,
        UUID tenantId,
        String accountType,
        String login,
        String name
) {
}
