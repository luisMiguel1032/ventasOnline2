package com.amazonka.catalog.api;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.amazonka.catalog.api.dto.DealRequest;
import com.amazonka.catalog.api.dto.DealSummary;
import com.amazonka.catalog.application.CatalogService;
import com.amazonka.common.exception.ApiErrorCode;
import com.amazonka.common.exception.ApiException;
import com.amazonka.common.security.JwtPrincipal;
import com.amazonka.common.web.PageResponse;

import jakarta.validation.Valid;

/**
 * Ofertas de la tienda. Las lecturas son públicas; crear, editar y
 * desactivar requiere un token de administrador.
 */
@RestController
@RequestMapping("/api/deals")
public class DealController {

    private final CatalogService catalogService;
    private final UUID defaultTenantId;

    public DealController(
            CatalogService catalogService,
            @Value("${app.default-tenant-id}") UUID defaultTenantId) {

        this.catalogService = catalogService;
        this.defaultTenantId = defaultTenantId;
    }

    @GetMapping
    public ResponseEntity<PageResponse<DealSummary>> deals(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID brandId,
            @RequestParam(required = false) BigDecimal minDiscount,
            @RequestParam(defaultValue = "discount_desc") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(catalogService.listDeals(
                tenant(jwt), type, categoryId, brandId, minDiscount,
                sort, page, size));
    }

    @GetMapping("/admin")
    public ResponseEntity<PageResponse<DealSummary>> adminDeals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal Jwt jwt) {

        requireAdmin(jwt);

        return ResponseEntity.ok(catalogService.listDealsForAdmin(
                tenant(jwt), page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DealSummary> deal(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(catalogService.getDeal(tenant(jwt), id));
    }

    @PostMapping
    public ResponseEntity<DealSummary> create(
            @Valid @RequestBody DealRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        requireAdmin(jwt);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(catalogService.createDeal(tenant(jwt), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DealSummary> update(
            @PathVariable UUID id,
            @Valid @RequestBody DealRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        requireAdmin(jwt);

        return ResponseEntity.ok(catalogService.updateDeal(
                tenant(jwt), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {

        requireAdmin(jwt);
        catalogService.deleteDeal(tenant(jwt), id);

        return ResponseEntity.noContent().build();
    }

    private void requireAdmin(Jwt jwt) {
        if (jwt == null) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    ApiErrorCode.NO_AUTORIZADO,
                    "Autenticación requerida");
        }

        if (!JwtPrincipal.from(jwt).isAdmin()) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    ApiErrorCode.PROHIBIDO,
                    "Solo un administrador puede gestionar ofertas");
        }
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
