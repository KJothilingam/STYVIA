-- Insert default roles
INSERT INTO roles (id, name) VALUES (1, 'ROLE_CUSTOMER') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO roles (id, name) VALUES (2, 'ROLE_ADMIN') ON DUPLICATE KEY UPDATE name=name;

-- Insert default admin user
-- Password is 'admin123' hashed with BCrypt
INSERT INTO users (id, name, email, password, phone, is_active, created_at, updated_at)
VALUES (1, 'Admin User', 'admin@stylediscovery.com', '$2a$10$rKZB9qRxvVxzJKhvK5Xzze5LJjKqF6k1KZ0ZJ5oGxQ8xYqQH9YqRW', '9999999999', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=name;

-- Assign admin role to admin user
INSERT INTO user_roles (user_id, role_id) VALUES (1, 2) ON DUPLICATE KEY UPDATE user_id=user_id;
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1) ON DUPLICATE KEY UPDATE user_id=user_id;

