package com.amazonka.gateway.web;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;

import com.amazonka.gateway.config.GatewayHttpProperties;

import reactor.core.publisher.Mono;

/**
 * Rate limit simple por IP con bucket de tokens.
 *
 * Se activa solo con el perfil "scale" (gateway.http.rate-limit-enabled=true).
 * Es local a cada instancia: con varias réplicas del gateway hay que usar
 * Redis o un API gateway que limite de forma centralizada.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitWebFilter implements WebFilter {

    private static final int MAX_TRACKED_IPS = 10_000;

    private final GatewayHttpProperties properties;
    private final ConcurrentMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    public RateLimitWebFilter(GatewayHttpProperties properties) {
        this.properties = properties;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        if (!properties.isRateLimitEnabled()
                || exchange.getRequest().getPath().value().startsWith("/actuator")) {
            return chain.filter(exchange);
        }

        String ip = clientIp(exchange);
        Bucket bucket = buckets.computeIfAbsent(ip, key -> new Bucket(capacity()));

        if (buckets.size() > MAX_TRACKED_IPS) {
            buckets.clear();
        }

        if (!bucket.tryConsume()) {
            return tooManyRequests(exchange);
        }

        return chain.filter(exchange);
    }

    private int capacity() {
        return Math.max(1, properties.getRateLimitMaxRequests());
    }

    private static String clientIp(ServerWebExchange exchange) {
        return Optional.ofNullable(exchange.getRequest().getRemoteAddress())
                .map(InetSocketAddress::getAddress)
                .map(address -> address.getHostAddress())
                .orElse("unknown");
    }

    private Mono<Void> tooManyRequests(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String body = "{\"code\":\"DEMASIADAS_PETICIONES\","
                + "\"message\":\"Demasiadas peticiones, intenta de nuevo en unos segundos\"}";
        DataBuffer buffer = exchange.getResponse().bufferFactory()
                .wrap(body.getBytes(StandardCharsets.UTF_8));

        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    private final class Bucket {
        private final double capacity;
        private final double refillPerMs;
        private double tokens;
        private long lastRefill;

        private Bucket(double capacity) {
            this.capacity = capacity;
            this.tokens = capacity;
            this.lastRefill = System.currentTimeMillis();
            this.refillPerMs = capacity
                    / Math.max(1.0, properties.getRateLimitWindowSeconds() * 1000.0);
        }

        synchronized boolean tryConsume() {
            long now = System.currentTimeMillis();
            double elapsed = Math.max(0, now - lastRefill);
            tokens = Math.min(capacity, tokens + elapsed * refillPerMs);
            lastRefill = now;

            if (tokens < 1.0) {
                return false;
            }

            tokens -= 1.0;
            return true;
        }
    }
}
