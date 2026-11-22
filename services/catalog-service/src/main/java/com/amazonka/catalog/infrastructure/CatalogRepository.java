package com.amazonka.catalog.infrastructure;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import com.amazonka.catalog.api.dto.BrandDto;
import com.amazonka.catalog.api.dto.CategoryDto;
import com.amazonka.catalog.api.dto.DealRequest;
import com.amazonka.catalog.api.dto.DealSummary;
import com.amazonka.catalog.api.dto.ProductDetail;
import com.amazonka.catalog.api.dto.ProductRequest;
import com.amazonka.catalog.api.dto.ProductSummary;

/**
 * Acceso a las tablas del catálogo. Las lecturas usan las vistas
 * v_shop_products y v_shop_deals; las escrituras las realiza el panel
 * admin sobre products y product_deals.
 */
@Repository
public class CatalogRepository {

    private static final String SUMMARY_COLUMNS = """
            select id, name, slug, image, price, stock,
                   rating_avg, rating_count, category_name, brand_name,
                   deal_id, deal_price, deal_discount_percent, deal_type,
                   deal_title, deal_ends_at, deal_stock_remaining,
                   deal_stock_percent, deal_stock_limit, video_url,
                   short_description, compare_at_price, min_stock, show_in_shop
            from v_shop_products
            """;

    private static final String DEAL_COLUMNS = """
            select id, product_id, product_name, product_slug, image,
                   category_name, brand_name, original_price, deal_price,
                   discount_percent, deal_type, title, starts_at, ends_at,
                   stock_limit, stock_sold, stock_remaining, stock_percent,
                   product_stock, rating_avg, rating_count, status, is_active
            from v_shop_deals
            """;

    private final NamedParameterJdbcTemplate jdbc;

    public CatalogRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // ------------------------------------------------------------ Products

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
                rs.getString("brand_name"),
                rs.getObject("deal_id", UUID.class),
                rs.getBigDecimal("deal_price"),
                rs.getBigDecimal("deal_discount_percent"),
                rs.getString("deal_type"),
                rs.getString("deal_title"),
                toInstant(rs, "deal_ends_at"),
                rs.getBigDecimal("deal_stock_remaining"),
                nullableInt(rs, "deal_stock_percent"),
                rs.getBigDecimal("deal_stock_limit"),
                rs.getString("video_url"),
                rs.getString("short_description"),
                rs.getBigDecimal("compare_at_price"),
                rs.getBigDecimal("min_stock"),
                (Boolean) rs.getObject("show_in_shop")
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
                       categorie_id, category_name, brand_id, brand_name, unit_name,
                       deal_id, deal_price, deal_discount_percent, deal_type,
                       deal_title, deal_ends_at, deal_stock_remaining,
                       deal_stock_percent, deal_stock_limit, video_url,
                       short_description, principle_active, barcode, sku,
                       cost_price, compare_at_price, min_stock, sold_by_weight,
                       show_in_shop, track_inventory
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
                List.of(),
                rs.getObject("deal_id", UUID.class),
                rs.getBigDecimal("deal_price"),
                rs.getBigDecimal("deal_discount_percent"),
                rs.getString("deal_type"),
                rs.getString("deal_title"),
                toInstant(rs, "deal_ends_at"),
                rs.getBigDecimal("deal_stock_remaining"),
                nullableInt(rs, "deal_stock_percent"),
                rs.getBigDecimal("deal_stock_limit"),
                rs.getString("video_url"),
                rs.getString("short_description"),
                rs.getString("principle_active"),
                rs.getString("barcode"),
                rs.getString("sku"),
                rs.getBigDecimal("cost_price"),
                rs.getBigDecimal("compare_at_price"),
                rs.getBigDecimal("min_stock"),
                (Boolean) rs.getObject("sold_by_weight"),
                (Boolean) rs.getObject("show_in_shop"),
                (Boolean) rs.getObject("track_inventory")
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
                .addValue("videoUrl", request.videoUrl())
                .addValue("features", request.features())
                .addValue("type", normalizeOrDefault(request.type(), "physical"))
                .addValue("price", request.price())
                .addValue("stock", request.stock() == null ? BigDecimal.ZERO : request.stock())
                .addValue("unitName", normalizeOrDefault(request.unitName(), "unidad"))
                .addValue("shortDescription", blankToNull(request.shortDescription()))
                .addValue("principleActive", blankToNull(request.principleActive()))
                .addValue("barcode", blankToNull(request.barcode()))
                .addValue("sku", blankToNull(request.sku()))
                .addValue("costPrice", request.costPrice())
                .addValue("compareAtPrice", request.compareAtPrice())
                .addValue("minStock", request.minStock() == null ? BigDecimal.ZERO : request.minStock())
                .addValue("soldByWeight", request.soldByWeight() != null ? request.soldByWeight() : Boolean.FALSE)
                .addValue("showInShop", request.showInShop() != null ? request.showInShop() : Boolean.TRUE)
                .addValue("trackInventory", request.trackInventory() != null ? request.trackInventory() : Boolean.TRUE);

        jdbc.update("""
                insert into products (
                    id, tenant_id, category_id, brand_id, code, item_code,
                    name, description, slug, image, video_url, features, type, price,
                    stock, rating_avg, rating_count, unit_name, status,
                    short_description, principle_active, barcode, sku,
                    cost_price, compare_at_price, min_stock, sold_by_weight, show_in_shop, track_inventory
                ) values (
                    :id, :tenantId, :categoryId, :brandId, :code, :itemCode,
                    :name, :description, :slug, :image, :videoUrl, :features, :type,
                    :price, :stock, 0, 0, :unitName, 1,
                    :shortDescription, :principleActive, :barcode, :sku,
                    :costPrice, :compareAtPrice, :minStock, :soldByWeight, :showInShop, :trackInventory
                )
                """, params);
    }

    public boolean existsBySlugExcluding(UUID tenantId, String slug, UUID excludedId) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("slug", slug)
                .addValue("excludedId", excludedId);

        Boolean exists = jdbc.queryForObject("""
                select exists(
                    select 1 from products
                    where tenant_id = :tenantId and slug = :slug and id <> :excludedId
                )
                """, params, Boolean.class);

        return Boolean.TRUE.equals(exists);
    }

    public int updateProduct(
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
                .addValue("videoUrl", request.videoUrl())
                .addValue("features", request.features())
                .addValue("type", request.type() == null || request.type().isBlank() ? null : request.type().trim())
                .addValue("price", request.price())
                .addValue("stock", request.stock())
                .addValue("unitName", request.unitName() == null || request.unitName().isBlank() ? null : request.unitName().trim())
                .addValue("shortDescription", blankToNull(request.shortDescription()))
                .addValue("principleActive", blankToNull(request.principleActive()))
                .addValue("barcode", blankToNull(request.barcode()))
                .addValue("sku", blankToNull(request.sku()))
                .addValue("costPrice", request.costPrice())
                .addValue("compareAtPrice", request.compareAtPrice())
                .addValue("minStock", request.minStock())
                .addValue("soldByWeight", request.soldByWeight())
                .addValue("showInShop", request.showInShop())
                .addValue("trackInventory", request.trackInventory());

        return jdbc.update("""
                update products set
                    category_id = :categoryId,
                    brand_id = :brandId,
                    code = :code,
                    item_code = :itemCode,
                    name = :name,
                    description = :description,
                    slug = :slug,
                    image = :image,
                    video_url = :videoUrl,
                    features = :features,
                    type = coalesce(:type, type),
                    price = :price,
                    stock = coalesce(:stock, stock),
                    unit_name = coalesce(:unitName, unit_name),
                    short_description = coalesce(:shortDescription, short_description),
                    principle_active = coalesce(:principleActive, principle_active),
                    barcode = coalesce(:barcode, barcode),
                    sku = coalesce(:sku, sku),
                    cost_price = coalesce(:costPrice, cost_price),
                    compare_at_price = coalesce(:compareAtPrice, compare_at_price),
                    min_stock = coalesce(:minStock, min_stock),
                    sold_by_weight = coalesce(:soldByWeight, sold_by_weight),
                    show_in_shop = coalesce(:showInShop, show_in_shop),
                    track_inventory = coalesce(:trackInventory, track_inventory),
                    updated_at = now()
                where tenant_id = :tenantId and id = :id and status = 1
                """, params);
    }

    public int softDeleteProduct(UUID tenantId, UUID id) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("id", id);

        return jdbc.update("""
                update products
                set status = 0, updated_at = now()
                where tenant_id = :tenantId and id = :id and status = 1
                """, params);
    }

    // --------------------------------------------------------------- Deals

    public List<DealSummary> findDeals(
            UUID tenantId,
            String dealType,
            UUID categoryId,
            UUID brandId,
            BigDecimal minDiscount,
            String sort,
            int limit,
            int offset) {

        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildDealWhere(
                tenantId, dealType, categoryId, brandId, minDiscount, true, params);

        params.addValue("limit", limit);
        params.addValue("offset", offset);

        String sql = DEAL_COLUMNS
                + where
                + " order by " + resolveDealSort(sort)
                + " limit :limit offset :offset";

        return jdbc.query(sql, params, CatalogRepository::mapDeal);
    }

    public long countDeals(
            UUID tenantId,
            String dealType,
            UUID categoryId,
            UUID brandId,
            BigDecimal minDiscount) {

        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = buildDealWhere(
                tenantId, dealType, categoryId, brandId, minDiscount, true, params);

        Long total = jdbc.queryForObject(
                "select count(*) from v_shop_deals" + where,
                params,
                Long.class
        );

        return total == null ? 0L : total;
    }

    public List<DealSummary> findDealsForAdmin(
            UUID tenantId,
            int limit,
            int offset) {

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("limit", limit)
                .addValue("offset", offset);

        return jdbc.query(DEAL_COLUMNS + """
                 where tenant_id = :tenantId
                 order by deal_created_at desc
                 limit :limit offset :offset
                """, params, CatalogRepository::mapDeal);
    }

    public long countDealsForAdmin(UUID tenantId) {

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId);

        Long total = jdbc.queryForObject(
                "select count(*) from v_shop_deals where tenant_id = :tenantId",
                params,
                Long.class
        );

        return total == null ? 0L : total;
    }

    public Optional<DealSummary> findDeal(UUID tenantId, UUID id) {

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("id", id);

        return jdbc.query(
                DEAL_COLUMNS + " where tenant_id = :tenantId and id = :id",
                params,
                CatalogRepository::mapDeal
        ).stream().findFirst();
    }

    public boolean existsActiveDeal(UUID tenantId, UUID productId) {

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("productId", productId);

        Boolean exists = jdbc.queryForObject("""
                select exists(
                    select 1 from product_deals
                    where tenant_id = :tenantId
                      and product_id = :productId
                      and status = 1
                )
                """, params, Boolean.class);

        return Boolean.TRUE.equals(exists);
    }

    public boolean productExists(UUID tenantId, UUID productId) {

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("productId", productId);

        Boolean exists = jdbc.queryForObject("""
                select exists(
                    select 1 from products
                    where tenant_id = :tenantId and id = :productId and status = 1
                )
                """, params, Boolean.class);

        return Boolean.TRUE.equals(exists);
    }

    public void insertDeal(
            UUID tenantId,
            UUID id,
            DealRequest request,
            String dealType) {

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", id)
                .addValue("tenantId", tenantId)
                .addValue("productId", request.productId())
                .addValue("title", request.title())
                .addValue("dealType", dealType)
                .addValue("discountPercent", request.discountPercent())
                .addValue("stockLimit", request.stockLimit(), Types.NUMERIC)
                .addValue("stockSold", request.stockSold(), Types.NUMERIC)
                .addValue("startsAt",
                        OffsetDateTime.ofInstant(request.startsAt(), ZoneOffset.UTC),
                        Types.TIMESTAMP_WITH_TIMEZONE)
                .addValue("endsAt",
                        OffsetDateTime.ofInstant(request.endsAt(), ZoneOffset.UTC),
                        Types.TIMESTAMP_WITH_TIMEZONE)
                .addValue("status", request.status() == null ? 1 : request.status());

        jdbc.update("""
                insert into product_deals (
                    id, tenant_id, product_id, title, deal_type,
                    discount_percent, stock_limit, stock_sold,
                    starts_at, ends_at, status
                ) values (
                    :id, :tenantId, :productId, :title, :dealType,
                    :discountPercent,
                    coalesce(:stockLimit, (
                        select stock from products
                        where tenant_id = :tenantId and id = :productId
                    )),
                    coalesce(:stockSold, 0),
                    :startsAt, :endsAt, :status
                )
                """, params);
    }

    public int updateDeal(
            UUID tenantId,
            UUID id,
            DealRequest request,
            String dealType) {

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", id)
                .addValue("tenantId", tenantId)
                .addValue("productId", request.productId())
                .addValue("title", request.title())
                .addValue("dealType", dealType)
                .addValue("discountPercent", request.discountPercent())
                .addValue("stockLimit", request.stockLimit(), Types.NUMERIC)
                .addValue("stockSold", request.stockSold(), Types.NUMERIC)
                .addValue("startsAt",
                        OffsetDateTime.ofInstant(request.startsAt(), ZoneOffset.UTC),
                        Types.TIMESTAMP_WITH_TIMEZONE)
                .addValue("endsAt",
                        OffsetDateTime.ofInstant(request.endsAt(), ZoneOffset.UTC),
                        Types.TIMESTAMP_WITH_TIMEZONE)
                .addValue("status", request.status());

        return jdbc.update("""
                update product_deals set
                    product_id = :productId,
                    title = :title,
                    deal_type = :dealType,
                    discount_percent = :discountPercent,
                    stock_limit = coalesce(:stockLimit, stock_limit),
                    stock_sold = coalesce(:stockSold, stock_sold),
                    starts_at = :startsAt,
                    ends_at = :endsAt,
                    status = coalesce(:status, status),
                    updated_at = now()
                where tenant_id = :tenantId and id = :id
                """, params);
    }

    public int softDeleteDeal(UUID tenantId, UUID id) {

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("tenantId", tenantId)
                .addValue("id", id);

        return jdbc.update("""
                update product_deals
                set status = 0, updated_at = now()
                where tenant_id = :tenantId and id = :id
                """, params);
    }

    // ------------------------------------------------------------- Helpers

    private static DealSummary mapDeal(ResultSet rs, int rowNum) throws SQLException {
        return new DealSummary(
                rs.getObject("id", UUID.class),
                rs.getObject("product_id", UUID.class),
                rs.getString("product_name"),
                rs.getString("product_slug"),
                rs.getString("image"),
                rs.getString("category_name"),
                rs.getString("brand_name"),
                rs.getBigDecimal("original_price"),
                rs.getBigDecimal("deal_price"),
                rs.getBigDecimal("discount_percent"),
                rs.getString("deal_type"),
                rs.getString("title"),
                toInstant(rs, "starts_at"),
                toInstant(rs, "ends_at"),
                rs.getBigDecimal("stock_limit"),
                rs.getBigDecimal("stock_sold"),
                rs.getBigDecimal("stock_remaining"),
                nullableInt(rs, "stock_percent"),
                rs.getBigDecimal("product_stock"),
                rs.getBigDecimal("rating_avg"),
                rs.getInt("rating_count"),
                nullableInt(rs, "status"),
                rs.getBoolean("is_active")
        );
    }

    private static Instant toInstant(ResultSet rs, String column) throws SQLException {
        OffsetDateTime value = rs.getObject(column, OffsetDateTime.class);
        return value == null ? null : value.toInstant();
    }

    private static Integer nullableInt(ResultSet rs, String column) throws SQLException {
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }

    private static String normalizeOrDefault(String value, String defaultValue) {
        return value == null || value.isBlank()
                ? defaultValue
                : value.trim();
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
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
                images,
                product.dealId(),
                product.dealPrice(),
                product.dealDiscountPercent(),
                product.dealType(),
                product.dealTitle(),
                product.dealEndsAt(),
                product.dealStockRemaining(),
                product.dealStockPercent(),
                product.dealStockLimit(),
                product.videoUrl(),
                product.shortDescription(),
                product.principleActive(),
                product.barcode(),
                product.sku(),
                product.costPrice(),
                product.compareAtPrice(),
                product.minStock(),
                product.soldByWeight(),
                product.showInShop(),
                product.trackInventory()
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

    private static String buildDealWhere(
            UUID tenantId,
            String dealType,
            UUID categoryId,
            UUID brandId,
            BigDecimal minDiscount,
            boolean onlyActive,
            MapSqlParameterSource params) {

        StringBuilder where = new StringBuilder(" where tenant_id = :tenantId");
        params.addValue("tenantId", tenantId);

        if (onlyActive) {
            where.append(" and status = 1 and is_active = true");
        }

        if (dealType != null && !dealType.isBlank()) {
            where.append(" and deal_type = :dealType");
            params.addValue("dealType", dealType.trim().toUpperCase());
        }

        if (categoryId != null) {
            where.append(" and categorie_id = :categoryId");
            params.addValue("categoryId", categoryId);
        }

        if (brandId != null) {
            where.append(" and brand_id = :brandId");
            params.addValue("brandId", brandId);
        }

        if (minDiscount != null) {
            where.append(" and discount_percent >= :minDiscount");
            params.addValue("minDiscount", minDiscount);
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

    private static String resolveDealSort(String sort) {
        return switch (sort == null ? "" : sort) {
            case "ending_soon" -> "ends_at asc";
            case "price_asc" -> "deal_price asc";
            case "price_desc" -> "deal_price desc";
            case "newest" -> "deal_created_at desc";
            default -> "discount_percent desc, ends_at asc";
        };
    }
}
