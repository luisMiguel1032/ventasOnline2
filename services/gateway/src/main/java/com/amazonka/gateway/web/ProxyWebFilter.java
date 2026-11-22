package com.amazonka.gateway.web;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Set;

import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;

import com.amazonka.gateway.config.GatewayProperties;

import reactor.core.publisher.Mono;

/**
 * Proxy HTTP simple: reenvía la petición al microservicio dueño del prefijo
 * y devuelve su respuesta tal cual. Mantiene el gateway sin dependencias de
 * Spring Cloud (compatible con Spring Boot 4.1).
 */
@Component
public class ProxyWebFilter implements WebFilter {

    private static final Set<String> HOP_BY_HOP = Set.of(
            "connection",
            "keep-alive",
            "proxy-authenticate",
            "proxy-authorization",
            "te",
            "trailer",
            "transfer-encoding",
            "upgrade"
    );

    private final GatewayProperties properties;
    private final WebClient webClient;
    private final RouteCircuitBreaker circuitBreaker;

    public ProxyWebFilter(
            GatewayProperties properties,
            WebClient webClient,
            RouteCircuitBreaker circuitBreaker) {

        this.properties = properties;
        this.webClient = webClient;
        this.circuitBreaker = circuitBreaker;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {

        String path = exchange.getRequest().getPath().value();
        GatewayProperties.Route route = properties.match(path);

        if (route == null) {
            return chain.filter(exchange);
        }

        if (!circuitBreaker.allows(route.id())) {
            return serviceUnavailable(exchange, route);
        }

        String query = exchange.getRequest().getURI().getRawQuery();
        String target = route.uri() + path + (query == null ? "" : "?" + query);

        return webClient
                .method(exchange.getRequest().getMethod())
                .uri(URI.create(target))
                .headers(headers -> copyRequestHeaders(exchange, headers))
                .body(BodyInserters.fromDataBuffers(exchange.getRequest().getBody()))
                .exchangeToMono(response -> {
                    if (response.statusCode().is5xxServerError()) {
                        circuitBreaker.onFailure(route.id());
                    } else {
                        circuitBreaker.onSuccess(route.id());
                    }

                    exchange.getResponse().setStatusCode(response.statusCode());

                    response.headers().asHttpHeaders().forEach((name, values) -> {
                        if (!isHopByHop(name)) {
                            exchange.getResponse().getHeaders().put(name, values);
                        }
                    });

                    return exchange.getResponse().writeWith(
                            response.bodyToFlux(DataBuffer.class)
                    );
                })
                .onErrorResume(error -> {
                    circuitBreaker.onFailure(route.id());
                    return badGateway(exchange, route, error);
                });
    }

    private static void copyRequestHeaders(
            ServerWebExchange exchange,
            HttpHeaders target) {

        exchange.getRequest().getHeaders().forEach((name, values) -> {
            if (!HttpHeaders.HOST.equalsIgnoreCase(name) && !isHopByHop(name)) {
                target.put(name, values);
            }
        });
    }

    private static boolean isHopByHop(String name) {
        return HOP_BY_HOP.contains(name.toLowerCase());
    }

    private static Mono<Void> serviceUnavailable(
            ServerWebExchange exchange,
            GatewayProperties.Route route) {

        String message = "{\"code\":\"SERVICIO_NO_DISPONIBLE\","
                + "\"message\":\"El servicio " + route.id()
                + " está temporalmente no disponible\"}";

        exchange.getResponse().setStatusCode(HttpStatus.SERVICE_UNAVAILABLE);
        exchange.getResponse().getHeaders().setContentType(
                org.springframework.http.MediaType.APPLICATION_JSON);

        DataBuffer buffer = exchange.getResponse().bufferFactory()
                .wrap(message.getBytes(StandardCharsets.UTF_8));

        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    private static Mono<Void> badGateway(
            ServerWebExchange exchange,
            GatewayProperties.Route route,
            Throwable error) {

        String message = "{\"code\":\"SERVICIO_NO_DISPONIBLE\","
                + "\"message\":\"No se pudo contactar con " + route.id() + "\","
                + "\"detail\":\"" + escape(error.getMessage()) + "\"}";

        exchange.getResponse().setStatusCode(HttpStatus.BAD_GATEWAY);
        exchange.getResponse().getHeaders().setContentType(
                org.springframework.http.MediaType.APPLICATION_JSON);

        DataBuffer buffer = exchange.getResponse().bufferFactory()
                .wrap(message.getBytes(StandardCharsets.UTF_8));

        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    private static String escape(String value) {
        return value == null
                ? ""
                : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
