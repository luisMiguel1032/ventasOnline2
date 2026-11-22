package com.amazonka.gateway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Ajustes de resiliencia del proxy hacia los microservicios.
 *
 * Los valores por defecto son conservadores y no cambian el comportamiento
 * actual. El perfil "scale" los activa con valores ajustados para carga.
 */
@ConfigurationProperties(prefix = "gateway.http")
public class GatewayHttpProperties {

    private int connectTimeoutMs = 3_000;
    private int responseTimeoutMs = 10_000;
    private int readTimeoutMs = 10_000;
    private int writeTimeoutMs = 10_000;
    private int maxConnections = 200;
    private int pendingAcquireMaxCount = 500;
    private int pendingAcquireTimeoutMs = 3_000;

    private boolean circuitBreakerEnabled = true;
    private int circuitFailureThreshold = 5;
    private int circuitCooldownMs = 10_000;

    private boolean rateLimitEnabled = false;
    private int rateLimitMaxRequests = 300;
    private int rateLimitWindowSeconds = 60;

    public int getConnectTimeoutMs() {
        return connectTimeoutMs;
    }

    public void setConnectTimeoutMs(int connectTimeoutMs) {
        this.connectTimeoutMs = connectTimeoutMs;
    }

    public int getResponseTimeoutMs() {
        return responseTimeoutMs;
    }

    public void setResponseTimeoutMs(int responseTimeoutMs) {
        this.responseTimeoutMs = responseTimeoutMs;
    }

    public int getReadTimeoutMs() {
        return readTimeoutMs;
    }

    public void setReadTimeoutMs(int readTimeoutMs) {
        this.readTimeoutMs = readTimeoutMs;
    }

    public int getWriteTimeoutMs() {
        return writeTimeoutMs;
    }

    public void setWriteTimeoutMs(int writeTimeoutMs) {
        this.writeTimeoutMs = writeTimeoutMs;
    }

    public int getMaxConnections() {
        return maxConnections;
    }

    public void setMaxConnections(int maxConnections) {
        this.maxConnections = maxConnections;
    }

    public int getPendingAcquireMaxCount() {
        return pendingAcquireMaxCount;
    }

    public void setPendingAcquireMaxCount(int pendingAcquireMaxCount) {
        this.pendingAcquireMaxCount = pendingAcquireMaxCount;
    }

    public int getPendingAcquireTimeoutMs() {
        return pendingAcquireTimeoutMs;
    }

    public void setPendingAcquireTimeoutMs(int pendingAcquireTimeoutMs) {
        this.pendingAcquireTimeoutMs = pendingAcquireTimeoutMs;
    }

    public boolean isCircuitBreakerEnabled() {
        return circuitBreakerEnabled;
    }

    public void setCircuitBreakerEnabled(boolean circuitBreakerEnabled) {
        this.circuitBreakerEnabled = circuitBreakerEnabled;
    }

    public int getCircuitFailureThreshold() {
        return circuitFailureThreshold;
    }

    public void setCircuitFailureThreshold(int circuitFailureThreshold) {
        this.circuitFailureThreshold = circuitFailureThreshold;
    }

    public int getCircuitCooldownMs() {
        return circuitCooldownMs;
    }

    public void setCircuitCooldownMs(int circuitCooldownMs) {
        this.circuitCooldownMs = circuitCooldownMs;
    }

    public boolean isRateLimitEnabled() {
        return rateLimitEnabled;
    }

    public void setRateLimitEnabled(boolean rateLimitEnabled) {
        this.rateLimitEnabled = rateLimitEnabled;
    }

    public int getRateLimitMaxRequests() {
        return rateLimitMaxRequests;
    }

    public void setRateLimitMaxRequests(int rateLimitMaxRequests) {
        this.rateLimitMaxRequests = rateLimitMaxRequests;
    }

    public int getRateLimitWindowSeconds() {
        return rateLimitWindowSeconds;
    }

    public void setRateLimitWindowSeconds(int rateLimitWindowSeconds) {
        this.rateLimitWindowSeconds = rateLimitWindowSeconds;
    }
}
