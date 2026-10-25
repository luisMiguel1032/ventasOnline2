package com.amazonka.common.security;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;

import com.amazonka.common.exception.ApiError;
import com.amazonka.common.exception.ApiErrorCode;

import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.ObjectMapper;

/**
 * Devuelve los 401/403 del filtro de seguridad con el mismo formato ApiError
 * que el resto de la API (en vez del HTML/JSON por defecto de Spring).
 */
public final class JsonSecurityErrors {

    private JsonSecurityErrors() {
    }

    public static AuthenticationEntryPoint authenticationEntryPoint(
            ObjectMapper objectMapper) {

        return (request, response, error) -> write(
                response,
                objectMapper,
                HttpStatus.UNAUTHORIZED,
                ApiErrorCode.NO_AUTORIZADO,
                "Autenticación requerida",
                request.getRequestURI()
        );
    }

    public static AccessDeniedHandler accessDeniedHandler(
            ObjectMapper objectMapper) {

        return (request, response, error) -> write(
                response,
                objectMapper,
                HttpStatus.FORBIDDEN,
                ApiErrorCode.PROHIBIDO,
                "Acceso denegado",
                request.getRequestURI()
        );
    }

    private static void write(
            HttpServletResponse response,
            ObjectMapper objectMapper,
            HttpStatus status,
            ApiErrorCode code,
            String message,
            String path) throws IOException {

        ApiError error = new ApiError(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                code.name(),
                message,
                path,
                Map.of()
        );

        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getOutputStream(), error);
    }
}
