package com.amazonka.gateway.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Rutas del gateway: cada prefijo /api/xxx se envía al microservicio dueño.
 */
@ConfigurationProperties(prefix = "gateway")
public record GatewayProperties(List<Route> routes) {

    public record Route(
            String id,
            String prefix,
            String uri
    ) {
    }

    public Route match(String path) {
        if (routes == null) {
            return null;
        }

        return routes.stream()
                .filter(route -> path.equals(route.prefix())
                        || path.startsWith(route.prefix() + "/"))
                .findFirst()
                .orElse(null);
    }
}
