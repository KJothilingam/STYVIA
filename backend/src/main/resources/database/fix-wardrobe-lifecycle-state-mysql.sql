-- Fix: Data truncated for column 'lifecycle_state' when setting DONATED (MySQL ENUM too narrow or missing value).
-- Run once against your Styvia database, then restart the app if needed.
ALTER TABLE wardrobe_items
    MODIFY COLUMN lifecycle_state VARCHAR(32) NOT NULL DEFAULT 'NEW';
