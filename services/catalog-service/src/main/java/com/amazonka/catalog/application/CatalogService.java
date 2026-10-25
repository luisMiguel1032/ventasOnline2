package com.amazonka.catalog.application;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.amazonka.catalog.api.dto.BrandDto;
import com.amazonka.catalog.api.dto.CategoryDto;
import com.amazonka.catalog.api.dto.ProductDetail;
import com.amazonka.catalog.api.dto.ProductSummary;
import com.amazonka.catalog.infrastructure.CatalogRepository;
import com.amazonka.common.exception.ApiErrorCode;
import com.amazonka.common.exception.ApiException;
import com.amazonka.common.web.PageResponse;

import org.springframework.http.HttpStatus;

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

    @Transactional(readOnly = true)
    public List<CategoryDto> listCategories(UUID tenantId) {
        return repository.findCategories(tenantId);
    }

    @Transactional(readOnly = true)
    public List<BrandDto> listBrands(UUID tenantId) {
        return repository.findBrands(tenantId);
    }
}
