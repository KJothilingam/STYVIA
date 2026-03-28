package com.stylediscovery.bootstrap;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Runs {@link CatalogDemoSeedService} on startup so MySQL has the same ~36 demo SKUs the storefront shows via mocks.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
@RequiredArgsConstructor
@Slf4j
public class CatalogDemoSeedRunner implements ApplicationRunner {

    private final CatalogDemoSeedService catalogDemoSeedService;

    @Value("${app.catalog-demo-seed.enabled:true}")
    private boolean enabled;

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            log.debug("Catalog demo seed skipped (app.catalog-demo-seed.enabled=false)");
            return;
        }
        try {
            int added = catalogDemoSeedService.seedFromClasspath();
            if (added > 0) {
                log.info("Catalog demo seed: inserted {} product(s). Restart admin products page to see the full list.", added);
            }
        } catch (Exception e) {
            log.warn("Catalog demo seed failed (non-fatal): {}", e.getMessage());
        }
    }
}
