package com.stylediscovery.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Widen {@code donation_box_requests.status} and map legacy enum values to the new workflow.
 */
@Slf4j
@Component
@Order(3)
@RequiredArgsConstructor
public class DonationBoxStatusColumnFixRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute(
                    "ALTER TABLE donation_box_requests MODIFY COLUMN status VARCHAR(64) NOT NULL DEFAULT 'PENDING'");
            log.debug("donation_box_requests.status column is VARCHAR(64)");
        } catch (Exception e) {
            log.warn("Could not widen donation_box_requests.status: {}", e.getMessage());
        }
        try {
            int n = 0;
            n += jdbcTemplate.update("UPDATE donation_box_requests SET status = 'PENDING' WHERE status = 'REQUESTED'");
            n += jdbcTemplate.update("UPDATE donation_box_requests SET status = 'EXPECTED_DELIVERY' WHERE status IN ('BOX_SHIPPED','AWAITING_DROP')");
            n += jdbcTemplate.update("UPDATE donation_box_requests SET status = 'COMPLETED' WHERE status IN ('BOX_DELIVERED','COLLECTED')");
            if (n > 0) {
                log.info("Migrated {} donation_box_requests row(s) to new status values", n);
            }
        } catch (Exception e) {
            log.debug("Donation box status migration skipped: {}", e.getMessage());
        }
    }
}
