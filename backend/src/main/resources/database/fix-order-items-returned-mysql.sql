-- Run once on MySQL if `order_items.returned` exists without DEFAULT (error 1364).
ALTER TABLE order_items MODIFY COLUMN returned TINYINT(1) NOT NULL DEFAULT 0;
