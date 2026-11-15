package com.amazonka.catalog.application;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.amazonka.catalog.api.dto.BrandDto;
import com.amazonka.catalog.api.dto.CategoryDto;
import com.amazonka.catalog.api.dto.DealRequest;
import com.amazonka.catalog.api.dto.DealSummary;
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
    private static final Set<String> DEAL_TYPES =
            Set.of("DAILY", "LIGHTNING", "FEATURED");

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

    @Transactional
    public ProductDetail updateProduct(UUID tenantId, UUID id, ProductRequest request) {
        ProductDetail existing = getProduct(tenantId, id);

        String slug;
        if (request.name().trim().equals(existing.name())) {
            slug = existing.slug();
        } else {
            slug = uniqueSlugExcluding(tenantId, request.name(), id);
        }

        String code = hasText(request.code())
                ? request.code().trim()
                : existing.code();
        String itemCode = hasText(request.itemCode())
                ? request.itemCode().trim()
                : existing.itemCode();

        try {
            int updated = repository.updateProduct(
                    tenantId, id, slug, code, itemCode, request);
            if (updated == 0) {
                throw new ApiException(
                        HttpStatus.NOT_FOUND,
                        ApiErrorCode.NO_ENCONTRADO,
                        "Producto no encontrado"
                );
            }
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
                        "No se pudo leer el producto actualizado"
                ));
    }

    @Transactional
    public void deleteProduct(UUID tenantId, UUID id) {
        getProduct(tenantId, id);

        int updated = repository.softDeleteProduct(tenantId, id);
        if (updated == 0) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    ApiErrorCode.NO_ENCONTRADO,
                    "Producto no encontrado"
            );
        }
    }

    private String uniqueSlugExcluding(UUID tenantId, String name, UUID excludedId) {
        String base = slugify(name);
        String slug = base;
        int suffix = 2;

        while (repository.existsBySlugExcluding(tenantId, slug, excludedId)) {
            slug = base + "-" + suffix;
            suffix++;
        }

        return slug;
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

    // --------------------------------------------------------------- Deals

    @Transactional(readOnly = true)
    public PageResponse<DealSummary> listDeals(
            UUID tenantId,
            String dealType,
            UUID categoryId,
            UUID brandId,
            BigDecimal minDiscount,
            String sort,
            int page,
            int size) {

        int safePage = Math.max(0, page);
        int safeSize = Math.min(MAX_PAGE_SIZE, Math.max(1, size));
        String normalizedType = hasText(dealType)
                ? normalizeDealType(dealType)
                : null;

        long total = repository.countDeals(
                tenantId, normalizedType, categoryId, brandId, minDiscount);

        List<DealSummary> content = repository.findDeals(
                tenantId, normalizedType, categoryId, brandId,
                minDiscount, sort, safeSize, safePage * safeSize);

        return PageResponse.of(content, safePage, safeSize, total);
    }

    @Transactional(readOnly = true)
    public PageResponse<DealSummary> listDealsForAdmin(
            UUID tenantId,
            int page,
            int size) {

        int safePage = Math.max(0, page);
        int safeSize = Math.min(MAX_PAGE_SIZE, Math.max(1, size));

        long total = repository.countDealsForAdmin(tenantId);
        List<DealSummary> content = repository.findDealsForAdmin(
                tenantId, safeSize, safePage * safeSize);

        return PageResponse.of(content, safePage, safeSize, total);
    }

    @Transactional(readOnly = true)
    public DealSummary getDeal(UUID tenantId, UUID id) {
        return repository.findDeal(tenantId, id)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        ApiErrorCode.NO_ENCONTRADO,
                        "Oferta no encontrada"
                ));
    }

    @Transactional
    public DealSummary createDeal(UUID tenantId, DealRequest request) {
        String dealType = normalizeDealType(request.dealType());
        validateDates(request.startsAt(), request.endsAt());

        if (!repository.productExists(tenantId, request.productId())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    ApiErrorCode.DATOS_INVALIDOS,
                    "El producto indicado no existe o está inactivo");
        }

        if (repository.existsActiveDeal(tenantId, request.productId())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ApiErrorCode.CONFLICTO,
                    "Ese producto ya tiene una oferta activa. Edítala o desactívala primero."
            );
        }

        UUID id = UUID.randomUUID();

        try {
            repository.insertDeal(tenantId, id, request, dealType);
        } catch (DuplicateKeyException ex) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ApiErrorCode.CONFLICTO,
                    "Ese producto ya tiene una oferta activa"
            );
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    ApiErrorCode.DATOS_INVALIDOS,
                    "No se pudo crear la oferta: revisa el producto y las fechas"
            );
        }

        return getDeal(tenantId, id);
    }

    @Transactional
    public DealSummary updateDeal(
            UUID tenantId,
            UUID id,
            DealRequest request) {

        DealSummary existing = getDeal(tenantId, id);
        String dealType = normalizeDealType(request.dealType());
        validateDates(request.startsAt(), request.endsAt());

        if (!repository.productExists(tenantId, request.productId())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    ApiErrorCode.DATOS_INVALIDOS,
                    "El producto indicado no existe o está inactivo");
        }

        boolean productChanged =
                !existing.productId().equals(request.productId());

        if (productChanged
                && repository.existsActiveDeal(tenantId, request.productId())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ApiErrorCode.CONFLICTO,
                    "Ese producto ya tiene una oferta activa"
            );
        }

        int updated;

        try {
            updated = repository.updateDeal(tenantId, id, request, dealType);
        } catch (DuplicateKeyException ex) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    ApiErrorCode.CONFLICTO,
                    "Ese producto ya tiene una oferta activa"
            );
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    ApiErrorCode.DATOS_INVALIDOS,
                    "No se pudo actualizar la oferta: revisa el producto y las fechas"
            );
        }

        if (updated == 0) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    ApiErrorCode.NO_ENCONTRADO,
                    "Oferta no encontrada"
            );
        }

        return getDeal(tenantId, id);
    }

    @Transactional
    public void deleteDeal(UUID tenantId, UUID id) {
        int updated = repository.softDeleteDeal(tenantId, id);

        if (updated == 0) {
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    ApiErrorCode.NO_ENCONTRADO,
                    "Oferta no encontrada"
            );
        }
    }

    private static void validateDates(Instant startsAt, Instant endsAt) {
        if (startsAt == null || endsAt == null || !endsAt.isAfter(startsAt)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    ApiErrorCode.DATOS_INVALIDOS,
                    "La fecha de fin debe ser posterior a la fecha de inicio"
            );
        }
    }

    private static String normalizeDealType(String value) {
        String normalized = value == null
                ? ""
                : value.trim().toUpperCase(Locale.ROOT);

        if (!DEAL_TYPES.contains(normalized)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    ApiErrorCode.DATOS_INVALIDOS,
                    "Tipo de oferta inválido. Usa DAILY, LIGHTNING o FEATURED"
            );
        }

        return normalized;
    }
}
