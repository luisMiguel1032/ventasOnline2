package com.amazonka.catalog.api;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.amazonka.catalog.api.dto.ProductDetail;
import com.amazonka.catalog.api.dto.ProductRequest;
import com.amazonka.catalog.api.dto.ProductSummary;
import com.amazonka.catalog.application.CatalogService;
import com.amazonka.common.exception.ApiErrorCode;
import com.amazonka.common.exception.ApiException;
import com.amazonka.common.security.JwtPrincipal;
import com.amazonka.common.web.PageResponse;

import jakarta.validation.Valid;

/**
 * API pública de productos bajo /api/products. El gateway enruta este
 * prefijo a catalog-service. Se mantiene también /api/catalog/products
 * por compatibilidad.
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final CatalogService catalogService;
    private final UUID defaultTenantId;

    public ProductController(
            CatalogService catalogService,
            @Value("${app.default-tenant-id}") UUID defaultTenantId) {

        this.catalogService = catalogService;
        this.defaultTenantId = defaultTenantId;
    }

    @GetMapping
    public ResponseEntity<PageResponse<ProductSummary>> products(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID brandId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "name_asc") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(catalogService.listProducts(
                tenant(jwt), q, categoryId, brandId, minPrice, maxPrice,
                sort, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDetail> product(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(catalogService.getProduct(tenant(jwt), id));
    }

    @PostMapping
    public ResponseEntity<ProductDetail> create(
            @Valid @RequestBody ProductRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        if (jwt == null) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    ApiErrorCode.NO_AUTORIZADO,
                    "Autenticación requerida");
        }

        JwtPrincipal principal = JwtPrincipal.from(jwt);
        if (!principal.isAdmin()) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    ApiErrorCode.PROHIBIDO,
                    "Solo un administrador puede crear productos");
        }

        UUID tenantId = principal.tenantId() == null
                ? defaultTenantId
                : principal.tenantId();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(catalogService.createProduct(tenantId, request));
    }

    private UUID tenant(Jwt jwt) {
        if (jwt != null) {
            String claim = jwt.getClaimAsString("tenantId");
            if (claim != null) {
                return UUID.fromString(claim);
            }
        }

        return defaultTenantId;
    }
}
