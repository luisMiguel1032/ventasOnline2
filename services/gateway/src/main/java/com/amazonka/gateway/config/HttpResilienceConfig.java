package com.amazonka.gateway.config;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

/**
 * WebClient usado por el gateway para hablar con los microservicios.
 *
 * Spring Boot 4.1 ya no expone WebClientCustomizer, así que se crea el
 * WebClient directamente con timeout de conexión, timeout de respuesta,
 * timeouts de lectura/escritura y un pool acotado de conexiones.
 */
@Configuration
@EnableConfigurationProperties(GatewayHttpProperties.class)
public class HttpResilienceConfig {

    @Bean
    WebClient gatewayWebClient(GatewayHttpProperties properties) {
        ConnectionProvider provider = ConnectionProvider.builder("gateway-upstreams")
                .maxConnections(properties.getMaxConnections())
                .pendingAcquireMaxCount(properties.getPendingAcquireMaxCount())
                .pendingAcquireTimeout(
                        Duration.ofMillis(properties.getPendingAcquireTimeoutMs()))
                .build();

        HttpClient httpClient = HttpClient.create(provider)
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS,
                        properties.getConnectTimeoutMs())
                .responseTimeout(Duration.ofMillis(properties.getResponseTimeoutMs()))
                .doOnConnected(connection -> connection
                        .addHandlerLast(new ReadTimeoutHandler(
                                properties.getReadTimeoutMs(), TimeUnit.MILLISECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(
                                properties.getWriteTimeoutMs(), TimeUnit.MILLISECONDS)));

        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }
}
