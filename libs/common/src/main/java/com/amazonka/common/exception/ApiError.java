package com.amazonka.common.exception;

import java.time.Instant;
import java.util.Map;

/**
 * Formato único de error de la API.
 *
 * code    -> identificador estable para el frontend (ver ApiErrorCode)
 * message -> texto legible para mostrar al usuario
 * details -> errores por campo (campo -> mensaje); vacío si no aplica
 */
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String code,
        String message,
        String path,
        Map<String, String> details
) {
}
