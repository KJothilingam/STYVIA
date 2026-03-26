-- =============================================================================
-- STYVIA — Admin dashboard demo data (orders + order_items)
-- =============================================================================
-- Run in MySQL against your app database (default: fashion_ecommerce).
--
-- Prerequisites:
--   • Schema exists (JPA ddl-auto or schema.sql).
--   • At least one row in `products` (the app catalog).
--
-- What it does:
--   • Ensures a demo shopper user: demo.shopper@styvia.local / password: password
--   • Inserts one address and ~22 orders (order_number DASH-xxx) spread over the
--     last 7 days with mixed statuses so KPI cards, pie chart, area & bar charts fill.
--
-- Re-run: deletes previous DASH-* orders/items only, then re-inserts.
--
-- Login as admin still uses your existing admin user (e.g. admin@stylediscovery.com).
-- =============================================================================

USE fashion_ecommerce;

SET @product_id = (SELECT MIN(id) FROM products);
SET @pname = (SELECT COALESCE(MAX(name), 'Demo product') FROM products WHERE id = @product_id);
SET @pbrand = (SELECT COALESCE(MAX(brand), 'STYVIA') FROM products WHERE id = @product_id);

-- Demo shopper — BCrypt (Spring-compatible) for plain text: password
INSERT INTO users (name, email, password, phone, is_active, email_verified, created_at, updated_at)
VALUES (
  'Demo Shopper',
  'demo.shopper@styvia.local',
  '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
  '9880012345',
  TRUE,
  TRUE,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE name = VALUES(name);

SET @uid = (SELECT id FROM users WHERE email = 'demo.shopper@styvia.local' LIMIT 1);

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT @uid, r.id FROM roles r WHERE r.name = 'ROLE_CUSTOMER' LIMIT 1;

INSERT INTO addresses (user_id, name, phone, address_line1, city, state, pincode, country, address_type, is_default, created_at, updated_at)
SELECT @uid, 'Demo Shopper', '9880012345', '12 MG Road', 'Bengaluru', 'Karnataka', '560001', 'India', 'HOME', TRUE, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM addresses a WHERE a.user_id = @uid LIMIT 1);

SET @addr = (SELECT id FROM addresses WHERE user_id = @uid ORDER BY id DESC LIMIT 1);

DELETE oi FROM order_items oi
INNER JOIN orders o ON oi.order_id = o.id
WHERE o.order_number LIKE 'DASH-%';

DELETE FROM orders WHERE order_number LIKE 'DASH-%';

-- total_revenue on API = SUM(total_amount) for DELIVERED only — include several DELIVERED rows.
INSERT INTO orders (
  order_number, user_id, address_id, subtotal, discount, delivery_fee, total_amount,
  order_status, payment_status, payment_method, created_at, updated_at, delivered_at
) VALUES
('DASH-001', @uid, @addr, 1299.00, 0, 49.00, 1348.00, 'DELIVERED', 'SUCCESS', 'UPI', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
('DASH-002', @uid, @addr, 899.00, 50.00, 0, 849.00, 'PLACED', 'PENDING', 'COD', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), NULL),
('DASH-003', @uid, @addr, 2499.00, 0, 0, 2499.00, 'CONFIRMED', 'SUCCESS', 'CARD', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), NULL),
('DASH-004', @uid, @addr, 599.00, 0, 49.00, 648.00, 'SHIPPED', 'SUCCESS', 'UPI', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), NULL),
('DASH-005', @uid, @addr, 1799.00, 0, 0, 1799.00, 'DELIVERED', 'SUCCESS', 'COD', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
('DASH-006', @uid, @addr, 449.00, 0, 49.00, 498.00, 'CANCELLED', 'REFUNDED', 'UPI', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), NULL),
('DASH-007', @uid, @addr, 3299.00, 200.00, 0, 3099.00, 'DELIVERED', 'SUCCESS', 'NET_BANKING', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('DASH-008', @uid, @addr, 799.00, 0, 0, 799.00, 'PLACED', 'PENDING', 'COD', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), NULL),
('DASH-009', @uid, @addr, 1199.00, 0, 49.00, 1248.00, 'CONFIRMED', 'SUCCESS', 'CARD', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL),
('DASH-010', @uid, @addr, 1599.00, 0, 0, 1599.00, 'DELIVERED', 'SUCCESS', 'UPI', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
('DASH-011', @uid, @addr, 999.00, 0, 49.00, 1048.00, 'SHIPPED', 'SUCCESS', 'COD', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NULL),
('DASH-012', @uid, @addr, 2199.00, 0, 0, 2199.00, 'DELIVERED', 'SUCCESS', 'UPI', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
('DASH-013', @uid, @addr, 649.00, 0, 0, 649.00, 'PLACED', 'PENDING', 'COD', DATE_SUB(NOW(), INTERVAL 0 DAY), DATE_SUB(NOW(), INTERVAL 0 DAY), NULL),
('DASH-014', @uid, @addr, 1899.00, 100.00, 49.00, 1848.00, 'CONFIRMED', 'SUCCESS', 'CARD', DATE_SUB(NOW(), INTERVAL 0 DAY), DATE_SUB(NOW(), INTERVAL 0 DAY), NULL),
('DASH-015', @uid, @addr, 4299.00, 0, 0, 4299.00, 'DELIVERED', 'SUCCESS', 'NET_BANKING', DATE_SUB(NOW(), INTERVAL 0 DAY), DATE_SUB(NOW(), INTERVAL 0 DAY), NULL),
('DASH-016', @uid, @addr, 749.00, 0, 49.00, 798.00, 'CANCELLED', 'FAILED', 'UPI', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), NULL),
('DASH-017', @uid, @addr, 1399.00, 0, 0, 1399.00, 'DELIVERED', 'SUCCESS', 'COD', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('DASH-018', @uid, @addr, 899.00, 0, 0, 899.00, 'SHIPPED', 'SUCCESS', 'UPI', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL),
('DASH-019', @uid, @addr, 2599.00, 0, 49.00, 2648.00, 'DELIVERED', 'SUCCESS', 'CARD', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 0 DAY)),
('DASH-020', @uid, @addr, 499.00, 0, 49.00, 548.00, 'PLACED', 'PENDING', 'COD', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), NULL),
('DASH-021', @uid, @addr, 3199.00, 0, 0, 3199.00, 'DELIVERED', 'SUCCESS', 'UPI', DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
('DASH-022', @uid, @addr, 1099.00, 0, 0, 1099.00, 'CONFIRMED', 'SUCCESS', 'COD', DATE_SUB(NOW(), INTERVAL 0 DAY), DATE_SUB(NOW(), INTERVAL 0 DAY), NULL);

INSERT INTO order_items (order_id, product_id, product_name, product_brand, size, color, price, quantity, subtotal)
SELECT o.id, @product_id, @pname, @pbrand, 'M', 'Default', o.subtotal, 1, o.subtotal
FROM orders o
WHERE o.order_number LIKE 'DASH-%';

SELECT 'Dashboard seed done. Demo login: demo.shopper@styvia.local / password' AS note;
