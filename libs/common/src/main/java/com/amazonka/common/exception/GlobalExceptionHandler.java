package com.amazonka.common.exception;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

/**
 * Devuelve TODOS los errores con el mismo formato (ApiError) para que el
 * frontend pueda distinguirlos por el campo "code".
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiError> handleApi(
            ApiException ex,
            HttpServletRequest request) {

        return build(
                ex.getStatus(),
                ex.getCode(),
                ex.getMessage(),
                request.getRequestURI(),
                ex.getDetails()
        );
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleStatus(
            ResponseStatusException ex,
            HttpServletRequest request) {

        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());

        if (status == null) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        String message = ex.getReason() != null
                ? ex.getReason()
                : status.getReasonPhrase();

        return build(
                status,
                ApiErrorCode.desdeStatus(status.value()),
                message,
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        Map<String, String> details = new LinkedHashMap<>();

        ex.getBindingResult().getFieldErrors().forEach(field -> details
                .putIfAbsent(field.getField(), field.getDefaultMessage()));

        ex.getBindingResult().getGlobalErrors().forEach(error -> details
                .putIfAbsent(error.getObjectName(), error.getDefaultMessage()));

        return build(
                HttpStatus.BAD_REQUEST,
                ApiErrorCode.DATOS_INVALIDOS,
                "Los datos enviados no son válidos",
                request.getRequestURI(),
                details
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleNotReadable(
            HttpMessageNotReadableException ex,
            HttpServletRequest request) {

        return build(
                HttpStatus.BAD_REQUEST,
                ApiErrorCode.DATOS_INVALIDOS,
                "El cuerpo de la petición está mal formado o tiene tipos inválidos",
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request) {

        Map<String, String> details = Map.of(
                ex.getName(),
                "Valor inválido: " + ex.getValue()
        );

        return build(
                HttpStatus.BAD_REQUEST,
                ApiErrorCode.DATOS_INVALIDOS,
                "Los parámetros de la petición no son válidos",
                request.getRequestURI(),
                details
        );
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiError> handleMissingParam(
            MissingServletRequestParameterException ex,
            HttpServletRequest request) {

        Map<String, String> details = Map.of(
                ex.getParameterName(),
                "El parámetro es obligatorio"
        );

        return build(
                HttpStatus.BAD_REQUEST,
                ApiErrorCode.DATOS_INVALIDOS,
                "Faltan parámetros obligatorios",
                request.getRequestURI(),
                details
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraint(
            ConstraintViolationException ex,
            HttpServletRequest request) {

        Map<String, String> details = new LinkedHashMap<>();

        ex.getConstraintViolations().forEach(violation -> details.putIfAbsent(
                violation.getPropertyPath().toString(),
                violation.getMessage()
        ));

        return build(
                HttpStatus.BAD_REQUEST,
                ApiErrorCode.DATOS_INVALIDOS,
                "Los datos enviados no son válidos",
                request.getRequestURI(),
                details
        );
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> handleMaxUpload(
            MaxUploadSizeExceededException ex,
            HttpServletRequest request) {

        return build(
                HttpStatus.PAYLOAD_TOO_LARGE,
                ApiErrorCode.ARCHIVO_DEMASIADO_GRANDE,
                "El archivo supera el tamaño máximo permitido",
                request.getRequestURI(),
                Map.of()
        );
    }

    private static ResponseEntity<ApiError> build(
            HttpStatus status,
            ApiErrorCode code,
            String message,
            String path,
            Map<String, String> details) {

        ApiError error = new ApiError(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                code.name(),
                message,
                path,
                details == null ? Map.of() : details
        );

        return ResponseEntity.status(status).body(error);
    }
}
