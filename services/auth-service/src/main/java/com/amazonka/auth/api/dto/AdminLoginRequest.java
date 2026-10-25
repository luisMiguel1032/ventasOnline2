package com.amazonka.auth.api.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;

/**
 * Login del personal administrativo (tabla users).
 * tenantId es opcional: si no viene se usa la tienda por defecto.
 */
public record AdminLoginRequest(
        UUID tenantId,
        @NotBlank(message = "El usuario es obligatorio") String login,
        @NotBlank(message = "La contraseña es obligatoria") String password
) {
}
