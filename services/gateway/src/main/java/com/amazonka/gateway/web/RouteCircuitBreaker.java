package com.amazonka.gateway.web;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.stereotype.Component;

import com.amazonka.gateway.config.GatewayHttpProperties;

/**
 * Circuit breaker mínimo por ruta, sin dependencias externas.
 *
 * Si un servicio falla N veces seguidas, el gateway deja de llamarlo durante
 * un tiempo (fail fast con 503). Pasado ese tiempo permite una petición de
 * prueba y se cierra solo si funciona.
 *
 * Es una protección local a cada instancia del gateway. Con varias réplicas
 * habría que sustituirlo por Resilience4j + un estado compartido.
 */
@Component
public class RouteCircuitBreaker {

    private final GatewayHttpProperties properties;
    private final ConcurrentMap<String, State> states = new ConcurrentHashMap<>();

    public RouteCircuitBreaker(GatewayHttpProperties properties) {
        this.properties = properties;
    }

    public boolean allows(String routeId) {
        if (!properties.isCircuitBreakerEnabled()) {
            return true;
        }

        State state = states.computeIfAbsent(routeId, key -> new State());
        synchronized (state) {
            long now = System.currentTimeMillis();

            if (state.openUntil > now) {
                return false;
            }

            if (state.openUntil != 0) {
                // Cooldown terminado: permite una petición de prueba.
                state.openUntil = 0;
                state.failures = 0;
            }

            return true;
        }
    }

    public void onSuccess(String routeId) {
        State state = states.get(routeId);
        if (state == null) {
            return;
        }

        synchronized (state) {
            state.failures = 0;
            state.openUntil = 0;
        }
    }

    public void onFailure(String routeId) {
        if (!properties.isCircuitBreakerEnabled()) {
            return;
        }

        State state = states.computeIfAbsent(routeId, key -> new State());
        synchronized (state) {
            if (state.openUntil > System.currentTimeMillis()) {
                return;
            }

            state.failures++;
            if (state.failures >= properties.getCircuitFailureThreshold()) {
                state.openUntil = System.currentTimeMillis()
                        + properties.getCircuitCooldownMs();
                state.failures = 0;
            }
        }
    }

    private static final class State {
        private int failures;
        private long openUntil;
    }
}
