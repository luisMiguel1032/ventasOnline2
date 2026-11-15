package com.amazonka.catalog.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Datos para crear o editar una oferta desde el panel de administración.
 */
public record DealRequest(
        @NotNull(message = "El producto es obligatorio")
        UUID productId,

        @Size(max = 160, message = "El título no puede superar 160 caracteres")
        String title,

        @NotBlank(message = "El tipo de oferta es obligatorio")
        String dealType,

        @NotNull(message = "El descuento es obligatorio")
        @DecimalMin(value = "1.00", message = "El descuento mínimo es 1%")
        @DecimalMax(value = "90.00", message = "El descuento máximo es 90%")
        BigDecimal discountPercent,

        @NotNull(message = "La fecha de inicio es obligatoria")
        Instant startsAt,

        @NotNull(message = "La fecha de fin es obligatoria")
        Instant endsAt,

        @DecimalMin(value = "0.00", message = "El stock de la oferta no puede ser negativo")
        BigDecimal stockLimit,

        @DecimalMin(value = "0.00", message = "El stock vendido no puede ser negativo")
        BigDecimal stockSold,

        Integer status
) {
}
