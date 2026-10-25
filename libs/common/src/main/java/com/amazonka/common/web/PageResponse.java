package com.amazonka.common.web;

import java.util.List;

/**
 * Respuesta paginada genérica:
 * { content, page, size, totalElements, totalPages }.
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {

    public static <T> PageResponse<T> of(
            List<T> content,
            int page,
            int size,
            long totalElements) {

        int totalPages = size > 0
                ? (int) Math.ceil((double) totalElements / size)
                : 0;

        return new PageResponse<>(
                content,
                page,
                size,
                totalElements,
                Math.max(1, totalPages)
        );
    }
}
