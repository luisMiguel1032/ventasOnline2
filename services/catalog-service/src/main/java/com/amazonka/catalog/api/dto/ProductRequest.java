package com.amazonka.catalog.api.dto;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Datos para dar de alta un producto desde el panel de administración.
 * code/itemCode son opcionales: si no vienen se generan automáticamente.
 */
public record ProductRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 160, message = "El nombre no puede superar 160 caracteres")
        String name,

        @Size(max = 5000, message = "La descripción es demasiado larga")
        String description,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.00", message = "El precio no puede ser negativo")
        BigDecimal price,

        @DecimalMin(value = "0.00", message = "El stock no puede ser negativo")
        BigDecimal stock,

        UUID categoryId,
        UUID brandId,

        @Size(max = 500, message = "La URL de la imagen es demasiado larga")
        String image,

        @Size(max = 500, message = "La URL del video es demasiado larga")
        String videoUrl,

        String features,

        @Size(max = 40, message = "El tipo es demasiado largo")
        String type,

        @Size(max = 40, message = "La unidad es demasiado larga")
        String unitName,

        @Size(max = 50, message = "El código es demasiado largo")
        String code,

        @Size(max = 50, message = "El itemCode es demasiado largo")
        String itemCode,

        @Size(max = 500, message = "La descripción corta es demasiado larga")
        String shortDescription,
        String principleActive,
        @Size(max = 80, message = "El código de barras es demasiado largo")
        String barcode,
        @Size(max = 80, message = "El SKU es demasiado largo")
        String sku,
        BigDecimal costPrice,
        BigDecimal compareAtPrice,
        BigDecimal minStock,
        Boolean soldByWeight,
        Boolean showInShop,
        Boolean trackInventory
) {
}
