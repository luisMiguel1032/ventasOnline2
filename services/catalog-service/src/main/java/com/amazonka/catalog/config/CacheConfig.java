package com.amazonka.catalog.config;

import java.time.Duration;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import com.github.benmanes.caffeine.cache.Caffeine;

/**
 * Caché en memoria del catálogo. Solo se activa con el perfil "scale".
 *
 * TTL corto (30 s) para que las ofertas con cuenta regresiva no queden
 * congeladas demasiado tiempo. La clave de Spring incluye el método y
 * todos sus argumentos, así que una sola caché sirve para todas las
 * lecturas. Cualquier escritura del panel admin la invalida completa.
 *
 * Con varias réplicas cada una tendrá su propia caché; el siguiente paso
 * sería moverla a Redis para compartirla entre instancias.
 */
@Configuration
@EnableCaching
@Profile("scale")
public class CacheConfig {

    public static final String READS = "catalogReads";

    @Bean
    CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager(READS);
        manager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(2_000)
                .expireAfterWrite(Duration.ofSeconds(30))
                .recordStats());
        return manager;
    }
}
