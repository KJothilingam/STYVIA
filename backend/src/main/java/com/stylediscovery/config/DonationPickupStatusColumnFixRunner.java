package com.stylediscovery.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Existing databases often have {@code status} as MySQL ENUM or a short VARCHAR, which rejects
 * new values like REQ_ACCEPTED (error 1265 / data truncated). Normalize to VARCHAR(64) at startup.
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class DonationPickupStatusColumnFixRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute(
                    "ALTER TABLE donation_pickup_requests MODIFY COLUMN status VARCHAR(64) NOT NULL DEFAULT 'PENDING'");
            log.debug("donation_pickup_requests.status column is VARCHAR(64)");
        } catch (Exception e) {
            log.warn("Could not widen donation_pickup_requests.status (ignore if table not created yet): {}", e.getMessage());
        }
        try {
            int n = jdbcTemplate.update(
                    "UPDATE donation_pickup_requests SET status = 'PENDING' WHERE status IN ('SCHEDULED','PICKED_UP')");
            if (n > 0) {
                log.info("Migrated {} donation pickup row(s) from legacy SCHEDULED/PICKED_UP to PENDING", n);
            }
        } catch (Exception e) {
            log.debug("Legacy donation status migration skipped: {}", e.getMessage());
        }
    }
}
