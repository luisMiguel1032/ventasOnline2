package com.amazonka.common.exception;

/**
 * Códigos estables de error para que el frontend decida qué mostrar.
 */
public enum ApiErrorCode {

    DATOS_INVALIDOS,
    NO_AUTORIZADO,
    PROHIBIDO,
    NO_ENCONTRADO,
    CONFLICTO,
    CREDENCIALES_INVALIDAS,
    USUARIO_DESHABILITADO,
    ARCHIVO_DEMASIADO_GRANDE,
    ERROR_INTERNO;

    public static ApiErrorCode desdeStatus(int status) {
        return switch (status) {
            case 400 -> DATOS_INVALIDOS;
            case 401 -> NO_AUTORIZADO;
            case 403 -> PROHIBIDO;
            case 404 -> NO_ENCONTRADO;
            case 409 -> CONFLICTO;
            case 413 -> ARCHIVO_DEMASIADO_GRANDE;
            default -> ERROR_INTERNO;
        };
    }
}
