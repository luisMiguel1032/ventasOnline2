package com.amazonka.auth.api.dto;

import java.util.UUID;

public record MeResponse(
        UUID subjectId,
        UUID tenantId,
        String accountType,
        String login,
        String name
) {
}
