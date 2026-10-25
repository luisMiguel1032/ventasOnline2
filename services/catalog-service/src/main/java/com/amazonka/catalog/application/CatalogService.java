package com.amazonka.catalog.application;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.amazonka.catalog.api.dto.BrandDto;
import com.amazonka.catalog.api.dto.CategoryDto;
import com.amazonka.catalog.api.dto.ProductDetail;
import com.amazonka.catalog.api.dto.ProductRequest;
import com.amazonka.catalog.api.dto.ProductSummary;
import com.amazonka.catalog.infrastructure.CatalogRepository;
import com.amazonka.common.exception.ApiErrorCode;
import com.amazonka.common.exception.ApiException;
import com.amazonka.common.web.PageResponse;

@Service
public class CatalogService {

    private static final int MAX_PAGE_SIZE = 100;

    private final CatalogRepository repository;

    public CatalogService(CatalogRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductSummary> listProducts(
            UUID tenantId,
            String q,
            UUID categoryId,
            UUID brandId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String sort,
            int page,
            int size) {

        int safePage = Math.max(0, page);
        int safeSize = Math.min(MAX_PAGE_SIZE, Math.max(1, size));

        long total = repository.countProducts(
                tenantId, q, categoryId, brandId, minPrice, maxPrice);

        List<ProductSummary> content = repository.findProducts(
                tenantId, q, categoryId, brandId, minPrice, maxPrice,
                sort, safeSize, safePage * safeSize);

        return PageResponse.of(content, safePage, safeSize, total);
    }

    @Transactional(readOnly = true)
    public ProductDetail getProduct(UUID tenantId, UUID id) {
        return repository.findProduct(tenantId, id)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        ApiErrorCode.NO_ENCONTRADO,
                        "Producto no encontrado"
                ));
    }

    @Transactional
    public ProductDetail createProduct(UUID tenantId, ProductRequest request) {
        UUID id = UUID.randomUUID();
        String slug = uniqueSlug(tenantId, request.name());
        String code = hasText(request.code())
                ? request.code().trim()
                : "P-" + id.toString().substring(0, 8).toUpperCase(Locale.ROOT);
        String itemCode = hasText(request.itemCode())
                ? request.itemCode().trim()
                : code;

        try {
            repository.insertProduct(tenantId, id, slug, code, itemCode, request);
        } catch (DuplicateKeyException ex) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ApiErrorCode.CONFLICTO,
                    "Ya existe un producto con ese código o slug");
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    ApiErrorCode.DATOS_INVALIDOS,
                    "La categoría o la marca indicada no existe");
        }

        return repository.findProduct(tenantId, id)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        ApiErrorCode.ERROR_INTERNO,
                        "No se pudo leer el producto creado"
                ));
    }

    private String uniqueSlug(UUID tenantId, String name) {
        String base = slugify(name);
        String slug = base;
        int suffix = 2;

        while (repository.existsBySlug(tenantId, slug)) {
            slug = base + "-" + suffix;
            suffix++;
        }

        return slug;
    }

    private static String slugify(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");

        if (normalized.isBlank()) {
            normalized = "producto";
        }

        return normalized.length() > 120
                ? normalized.substring(0, 120)
                : normalized;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> listCategories(UUID tenantId) {
        return repository.findCategories(tenantId);
    }

    @Transactional(readOnly = true)
    public List<BrandDto> listBrands(UUID tenantId) {
        return repository.findBrands(tenantId);
    }
}
