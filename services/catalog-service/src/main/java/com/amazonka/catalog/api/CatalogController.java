package com.amazonka.catalog.api;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.amazonka.catalog.api.dto.BrandDto;
import com.amazonka.catalog.api.dto.CategoryDto;
import com.amazonka.catalog.api.dto.ProductDetail;
import com.amazonka.catalog.api.dto.ProductSummary;
import com.amazonka.catalog.application.CatalogService;
import com.amazonka.common.web.PageResponse;

@RestController
@RequestMapping("/api/catalog")
public class CatalogController {

    private final CatalogService catalogService;
    private final UUID defaultTenantId;

    public CatalogController(
            CatalogService catalogService,
            @Value("${app.default-tenant-id}") UUID defaultTenantId) {

        this.catalogService = catalogService;
        this.defaultTenantId = defaultTenantId;
    }

    @GetMapping("/products")
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

    @GetMapping("/products/{id}")
    public ResponseEntity<ProductDetail> product(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(catalogService.getProduct(tenant(jwt), id));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryDto>> categories(
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(
                catalogService.listCategories(tenant(jwt)));
    }

    @GetMapping("/brands")
    public ResponseEntity<List<BrandDto>> brands(
            @AuthenticationPrincipal Jwt jwt) {

        return ResponseEntity.ok(
                catalogService.listBrands(tenant(jwt)));
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
