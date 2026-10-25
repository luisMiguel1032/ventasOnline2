package com.amazonka.catalog.infrastructure;

import java.math.BigDecimal;
import java.sql.Types;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import com.amazonka.catalog.api.dto.BrandDto;
import com.amazonka.catalog.api.dto.CategoryDto;
import com.amazonka.catalog.api.dto.ProductDetail;
import com.amazonka.catalog.api.dto.ProductRequest;
import com.amazonka.catalog.api.dto.ProductSummary;

/**
 * Acceso a las tablas del catálogo. Las lecturas usan la vista
 * v_shop_products (producto + categoría + marca); las escrituras las
 * realiza el panel admin sobre products.
 */
@Repository
public class CatalogRepository {

    private static final String SUMMARY_COLUMNS = """
            select id, name, slug, image, price, stock,
                   rating_avg, rating_count, category_name, brand_name
            from v_shop_products
            """;

    private final NamedParameterJdbcTemplate jdbc;

    public CatalogRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<ProductSummary> findProducts(
            UUID tenantId,
            String q,
            UUID categoryId,
            UUID brandId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String sort,
            int limit,
            int offset) {

        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildWhere(tenantId, q, categoryId, brandId, minPrice, maxPrice, params);

        params.addValue("limit", limit);
        params.addValue("offset", offset);

        String sql = SUMMARY_COLUMNS
                + where
                + " order by " + resolveSort(sort)
                + " limit :limit offset :offset";

        return jdbc.query(sql, params, (rs, rowNum) -> new ProductSummary(
                rs.getObject("id", UUID.class),
                rs.getString("name"),
                rs.getString("slug"),
                rs.getString("image"),
                rs.getBigDecimal("price"),
                rs.getBigDecimal("stock"),
                rs.getBigDecimal("rating_avg"),
                rs.getInt("rating_count"),
                rs.getString("category_name"),
                rs.getString("brand_name")
        ));
    }

    public long countProducts(
            UUID tenantId,
            String q,
            UUID categoryId,
            UUID brandId,
            BigDecimal minPrice,
            BigDecimal maxPrice) {

        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildWhere(tenantId, q, categoryId, brandId, minPrice, maxPrice, params);

        Long total = jdbc.queryForObject(
                "select count(*) from v_shop_products" + where,
                params,
                Long.class
        );

        return total == null ? 0L : total;
    }

    public Optional<ProductDetail> findProduct(UUID tenantId, UUID id) {

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("id", id);

        List<ProductDetail> results = jdbc.query("""
                select id, code, item_code, name, description, slug, image,
                       features, type, price, stock, rating_avg, rating_count,
                       categorie_id, category_name, brand_id, brand_name, unit_name
                from v_shop_products
                where tenant_id = :tenantId and id = :id
                """, params, (rs, rowNum) -> new ProductDetail(
                rs.getObject("id", UUID.class),
                rs.getString("code"),
                rs.getString("item_code"),
                rs.getString("name"),
                rs.getString("description"),
                rs.getString("slug"),
                rs.getString("image"),
                rs.getString("features"),
                rs.getString("type"),
                rs.getBigDecimal("price"),
                rs.getBigDecimal("stock"),
                rs.getBigDecimal("rating_avg"),
                rs.getInt("rating_count"),
                rs.getObject("categorie_id", UUID.class),
                rs.getString("category_name"),
                rs.getObject("brand_id", UUID.class),
                rs.getString("brand_name"),
                rs.getString("unit_name"),
                List.of()
        ));

        return results.stream().findFirst()
                .map(product -> withImages(product, tenantId));
    }

    public List<String> findImages(UUID tenantId, UUID productId) {

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("productId", productId);

        return jdbc.queryForList("""
                select image_path
                from product_images
                where tenant_id = :tenantId and product_id = :productId
                order by is_primary desc, sort_order asc, created_at asc
                """, params, String.class);
    }

    public List<CategoryDto> findCategories(UUID tenantId) {

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId);

        return jdbc.query("""
                select id, name, image, sort_order
                from categories
                where tenant_id = :tenantId and status = 1
                order by sort_order asc, name asc
                """, params, (rs, rowNum) -> new CategoryDto(
                rs.getObject("id", UUID.class),
                rs.getString("name"),
                rs.getString("image"),
                rs.getInt("sort_order")
        ));
    }

    public List<BrandDto> findBrands(UUID tenantId) {

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId);

        return jdbc.query("""
                select id, name
                from brands
                where tenant_id = :tenantId and status = 1
                order by name asc
                """, params, (rs, rowNum) -> new BrandDto(
                rs.getObject("id", UUID.class),
                rs.getString("name")
        ));
    }

    public boolean existsBySlug(UUID tenantId, String slug) {

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("slug", slug);

        Boolean exists = jdbc.queryForObject("""
                select exists(
                    select 1 from products
                    where tenant_id = :tenantId and slug = :slug
                )
                """, params, Boolean.class);

        return Boolean.TRUE.equals(exists);
    }

    public void insertProduct(
            UUID tenantId,
            UUID id,
            String slug,
            String code,
            String itemCode,
            ProductRequest request) {

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", id)
                .addValue("tenantId", tenantId)
                .addValue("categoryId", request.categoryId(), Types.OTHER)
                .addValue("brandId", request.brandId(), Types.OTHER)
                .addValue("code", code)
                .addValue("itemCode", itemCode)
                .addValue("name", request.name().trim())
                .addValue("description", request.description())
                .addValue("slug", slug)
                .addValue("image", request.image())
                .addValue("features", request.features())
                .addValue("type", normalizeOrDefault(request.type(), "physical"))
                .addValue("price", request.price())
                .addValue("stock", request.stock() == null
                        ? BigDecimal.ZERO
                        : request.stock())
                .addValue("unitName", normalizeOrDefault(request.unitName(), "unidad"));

        jdbc.update("""
                insert into products (
                    id, tenant_id, category_id, brand_id, code, item_code,
                    name, description, slug, image, features, type, price,
                    stock, rating_avg, rating_count, unit_name, status
                ) values (
                    :id, :tenantId, :categoryId, :brandId, :code, :itemCode,
                    :name, :description, :slug, :image, :features, :type,
                    :price, :stock, 0, 0, :unitName, 1
                )
                """, params);
    }

    private static String normalizeOrDefault(String value, String defaultValue) {
        return value == null || value.isBlank()
                ? defaultValue
                : value.trim();
    }

    private ProductDetail withImages(ProductDetail product, UUID tenantId) {
        List<String> images = findImages(tenantId, product.id());

        return new ProductDetail(
                product.id(),
                product.code(),
                product.itemCode(),
                product.name(),
                product.description(),
                product.slug(),
                product.image(),
                product.features(),
                product.type(),
                product.price(),
                product.stock(),
                product.ratingAvg(),
                product.ratingCount(),
                product.categoryId(),
                product.categoryName(),
                product.brandId(),
                product.brandName(),
                product.unitName(),
                images
        );
    }

    private static String buildWhere(
            UUID tenantId,
            String q,
            UUID categoryId,
            UUID brandId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            MapSqlParameterSource params) {

        StringBuilder where = new StringBuilder(" where tenant_id = :tenantId");
        params.addValue("tenantId", tenantId);

        if (q != null && !q.isBlank()) {
            where.append(" and name ilike :q");
            params.addValue("q", "%" + q.trim() + "%");
        }

        if (categoryId != null) {
            where.append(" and categorie_id = :categoryId");
            params.addValue("categoryId", categoryId);
        }

        if (brandId != null) {
            where.append(" and brand_id = :brandId");
            params.addValue("brandId", brandId);
        }

        if (minPrice != null) {
            where.append(" and price >= :minPrice");
            params.addValue("minPrice", minPrice);
        }

        if (maxPrice != null) {
            where.append(" and price <= :maxPrice");
            params.addValue("maxPrice", maxPrice);
        }

        return where.toString();
    }

    private static String resolveSort(String sort) {
        return switch (sort == null ? "" : sort) {
            case "price_asc" -> "price asc";
            case "price_desc" -> "price desc";
            case "rating" -> "rating_avg desc nulls last, rating_count desc";
            case "newest" -> "created_at desc";
            default -> "name asc";
        };
    }
}
