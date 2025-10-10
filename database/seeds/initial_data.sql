-- ==========================================
-- ZARMIND - Initial Seed Data
-- Persian Jewelry Store Sample Data
-- ==========================================

-- Note: Run this AFTER schema.sql
-- This file contains sample/demo data for testing and development

BEGIN;

-- ==========================================
-- CLEAR EXISTING DATA (Optional - for re-seeding)
-- ==========================================

TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE sale_items CASCADE;
TRUNCATE TABLE sales CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE gold_prices CASCADE;
TRUNCATE TABLE users CASCADE;
-- Keep system_settings and migrations

-- Reset sequences if any
-- ALTER SEQUENCE migrations_id_seq RESTART WITH 1;

-- ==========================================
-- USERS
-- ==========================================

-- Password for all users: "password123"
-- Hash: $2a$10$N9qo8uLOickgx2ZMRZoMye7VxJnPgEqP3RqKzLOvGJLxBKlPqoGUi

INSERT INTO users (id, username, email, password, full_name, role, phone, is_active) VALUES
-- Admin
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin', 'admin@zarmind.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7VxJnPgEqP3RqKzLOvGJLxBKlPqoGUi', 'مدیر سیستم', 'admin', '09121234567', true),

-- Manager
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'manager1', 'manager@zarmind.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7VxJnPgEqP3RqKzLOvGJLxBKlPqoGUi', 'رضا احمدی', 'manager', '09121234568', true),

-- Employees
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'employee1', 'employee1@zarmind.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7VxJnPgEqP3RqKzLOvGJLxBKlPqoGUi', 'فاطمه کریمی', 'employee', '09121234569', true),
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'employee2', 'employee2@zarmind.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7VxJnPgEqP3RqKzLOvGJLxBKlPqoGUi', 'محمد حسینی', 'employee', '09121234570', true),

-- Viewer
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'viewer1', 'viewer@zarmind.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye7VxJnPgEqP3RqKzLOvGJLxBKlPqoGUi', 'سارا رضایی', 'viewer', '09121234571', true);

-- ==========================================
-- GOLD PRICES (Historical Data)
-- ==========================================

INSERT INTO gold_prices (carat, price_per_gram, date, created_by) VALUES
-- Last 7 days - 18 Carat
(18, 3200000, CURRENT_DATE - INTERVAL '7 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(18, 3250000, CURRENT_DATE - INTERVAL '6 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(18, 3300000, CURRENT_DATE - INTERVAL '5 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(18, 3350000, CURRENT_DATE - INTERVAL '4 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(18, 3400000, CURRENT_DATE - INTERVAL '3 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(18, 3450000, CURRENT_DATE - INTERVAL '2 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(18, 3500000, CURRENT_DATE - INTERVAL '1 day', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(18, 3550000, CURRENT_DATE, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),

-- Last 7 days - 21 Carat
(21, 3700000, CURRENT_DATE - INTERVAL '7 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(21, 3750000, CURRENT_DATE - INTERVAL '6 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(21, 3800000, CURRENT_DATE - INTERVAL '5 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(21, 3850000, CURRENT_DATE - INTERVAL '4 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(21, 3900000, CURRENT_DATE - INTERVAL '3 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(21, 3950000, CURRENT_DATE - INTERVAL '2 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(21, 4000000, CURRENT_DATE - INTERVAL '1 day', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(21, 4050000, CURRENT_DATE, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),

-- Last 7 days - 22 Carat
(22, 3900000, CURRENT_DATE - INTERVAL '7 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(22, 3950000, CURRENT_DATE - INTERVAL '6 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(22, 4000000, CURRENT_DATE - INTERVAL '5 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(22, 4050000, CURRENT_DATE - INTERVAL '4 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(22, 4100000, CURRENT_DATE - INTERVAL '3 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(22, 4150000, CURRENT_DATE - INTERVAL '2 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(22, 4200000, CURRENT_DATE - INTERVAL '1 day', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(22, 4250000, CURRENT_DATE, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),

-- Last 7 days - 24 Carat
(24, 4200000, CURRENT_DATE - INTERVAL '7 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(24, 4250000, CURRENT_DATE - INTERVAL '6 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(24, 4300000, CURRENT_DATE - INTERVAL '5 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(24, 4350000, CURRENT_DATE - INTERVAL '4 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(24, 4400000, CURRENT_DATE - INTERVAL '3 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(24, 4450000, CURRENT_DATE - INTERVAL '2 days', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(24, 4500000, CURRENT_DATE - INTERVAL '1 day', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
(24, 4550000, CURRENT_DATE, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- ==========================================
-- CUSTOMERS
-- ==========================================

INSERT INTO customers (id, customer_code, full_name, phone, email, national_id, address, city, postal_code, birth_date, credit_limit, is_active) VALUES
('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'CUST-001', 'علی محمدی', '09121111111', 'ali.mohammadi@email.com', '0123456789', 'تهران، خیابان ولیعصر، پلاک 123', 'تهران', '1234567890', '1985-05-15', 50000000, true),
('f6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'CUST-002', 'زهرا احمدی', '09122222222', 'zahra.ahmadi@email.com', '9876543210', 'تهران، خیابان انقلاب، پلاک 456', 'تهران', '1234567891', '1990-08-20', 30000000, true),
('f7eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'CUST-003', 'حسین رضایی', '09123333333', 'hosein.rezaei@email.com', '1122334455', 'تهران، خیابان آزادی، پلاک 789', 'تهران', '1234567892', '1988-03-10', 20000000, true),
('f8eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'CUST-004', 'مریم کریمی', '09124444444', 'maryam.karimi@email.com', '5544332211', 'اصفهان، خیابان چهارباغ، پلاک 321', 'اصفهان', '8134567890', '1992-11-25', 40000000, true),
('f9eebc99-9c0b-4ef8-bb6d-6bb9bd380aaa', 'CUST-005', 'امیر حسینی', '09125555555', 'amir.hosseini@email.com', '6677889900', 'مشهد، خیابان امام رضا، پلاک 654', 'مشهد', '9134567890', '1987-07-18', 60000000, true),
('faeebc99-9c0b-4ef8-bb6d-6bb9bd380bbb', 'CUST-006', 'سارا نوری', '09126666666', 'sara.noori@email.com', '4433221100', 'شیراز، خیابان زند، پلاک 987', 'شیراز', '7134567890', '1995-12-05', 25000000, true),
('fbeebc99-9c0b-4ef8-bb6d-6bb9bd380ccc', 'CUST-007', 'محمدرضا فرهادی', '09127777777', 'mohammadreza@email.com', '9988776655', 'تبریز، خیابان امام خمینی، پلاک 147', 'تبریز', '5134567890', '1983-02-28', 35000000, true),
('fceebc99-9c0b-4ef8-bb6d-6bb9bd380ddd', 'CUST-008', 'نازنین اکبری', '09128888888', NULL, NULL, 'کرج، خیابان طالقانی، پلاک 258', 'کرج', '3134567890', '1998-09-14', 15000000, true),
('fdeebc99-9c0b-4ef8-bb6d-6bb9bd380eee', 'CUST-009', 'رضا صادقی', '09129999999', 'reza.sadeghi@email.com', '7766554433', 'قم، خیابان معلم، پلاک 369', 'قم', '3734567890', '1991-04-22', 45000000, true),
('feeebc99-9c0b-4ef8-bb6d-6bb9bd380fff', 'CUST-010', 'لیلا باقری', '09120000000', 'leila.bagheri@email.com', '3322114455', 'اهواز، خیابان نادری، پلاک 741', 'اهواز', '6134567890', '1994-06-30', 28000000, true);

-- ==========================================
-- PRODUCTS
-- ==========================================

INSERT INTO products (id, code, name, name_en, category, type, carat, weight, wage, stone_price, description, stock_quantity, min_stock_level, selling_price, created_by, is_active) VALUES
-- Rings
('10eebc99-9c0b-4ef8-bb6d-6bb9bd380111', 'PRD-001', 'انگشتر طلای زنانه نگین‌دار', 'Women Diamond Ring', 'gold', 'ring', 18, 3.5, 2000000, 5000000, 'انگشتر طلای 18 عیار با نگین الماس تراش برلیان', 5, 2, 25000000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true),
('11eebc99-9c0b-4ef8-bb6d-6bb9bd380222', 'PRD-002', 'انگشتر طلای مردانه', 'Men Gold Ring', 'gold', 'ring', 18, 5.2, 1500000, 0, 'انگشتر طلای 18 عیار ساده مردانه', 8, 3, 21000000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true),
('12eebc99-9c0b-4ef8-bb6d-6bb9bd380333', 'PRD-003', 'انگشتر حلقه ازدواج', 'Wedding Ring', 'gold', 'ring', 18, 2.8, 1000000, 0, 'حلقه ازدواج طلای 18 عیار', 15, 5, 12000000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true),

-- Necklaces
('13eebc99-9c0b-4ef8-bb6d-6bb9bd380444', 'PRD-004', 'گردنبند طلا با آویز قلب', 'Heart Pendant Necklace', 'gold', 'necklace', 18, 8.5, 3500000, 2000000, 'گردنبند طلای 18 عیار با آویز طرح قلب', 6, 2, 38000000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true),
('14eebc99-9c0b-4ef8-bb6d-6bb9bd380555', 'PRD-005', 'گردنبند طلای ونیزی', 'Venetian Necklace', 'gold', 'necklace', 18, 12.3, 4000000, 0, 'گردنبند طلای 18 عیار بافت ونیزی', 4, 2, 48000000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true),

-- Bracelets
('15eebc99-9c0b-4ef8-bb6d-6bb9bd380666', 'PRD-006', 'دستبند طلای زنجیری', 'Chain Bracelet', 'gold', 'bracelet', 18, 6.7, 2500000, 0, 'دستبند طلای 18 عیار طرح زنجیری', 10, 3, 28000000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true),
('16eebc99-9c0b-4ef8-bb6d-6bb9bd380777', 'PRD-007', 'دستبند طلا با نگین', 'Gemstone Bracelet', 'gold', 'bracelet', 18, 7.2, 2800000, 3000000, 'دستبند طلای 18 عیار نگین‌دار', 5, 2, 35000000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true),

-- Earrings
('17eebc99-9c0b-4ef8-bb6d-6bb9bd380888', 'PRD-008', 'گوشواره طلای حلقه‌ای', 'Hoop Earrings', 'gold', 'earring', 18, 4.5, 1800000, 0, 'گوشواره طلای 18 عیار طرح حلقه', 12, 4, 18500000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true),
('18eebc99-9c0b-4ef8-bb6d-6bb9bd380999', 'PRD-009', 'گوشواره طلا با مروارید', 'Pearl Earrings', 'gold', 'earring', 18, 3.2, 1500000, 4000000, 'گوشواره طلای 18 عیار با مروارید', 7, 2, 20000000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true),

-- Bangles
('19eebc99-9c0b-4ef8-bb6d-6bb9bd380aaa', 'PRD-010', 'النگو طلای کودک', 'Baby Bangle', 'gold', 'bangle', 18, 5.0, 1200000, 0, 'النگو طلای 18 عیار برای کودکان', 8, 3, 20000000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true),
('1aeebc99-9c0b-4ef8-bb6d-6bb9bd380bbb', 'PRD-011', 'النگو طلای بزرگسال', 'Adult Bangle', 'gold', 'bangle', 18, 15.5, 3500000, 0, 'النگو طلای 18 عیار بزرگسال', 6, 2, 60000000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true),

-- Pendants
('1beebc99-9c0b-4ef8-bb6d-6bb9bd380ccc', 'PRD-012', 'آویز طلای اسم', 'Name Pendant', 'gold', 'pendant', 18, 2.5, 800000, 0, 'آویز طلای 18 عیار با نام سفارشی', 20, 5, 10500000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true),

-- Coins
('1ceebc99-9c0b-4ef8-bb6d-6bb9bd380ddd', 'PRD-013', 'سکه امامی', 'Emami Gold Coin', 'gold', 'coin', 24, 8.133, 500000, 0, 'سکه طلای امامی (یک بهار آزادی)', 25, 10, 37500000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true),
('1deebc99-9c0b-4ef8-bb6d-6bb9bd380eee', 'PRD-014', 'نیم سکه', 'Half Gold Coin', 'gold', 'coin', 24, 4.066, 400000, 0, 'نیم سکه طلا', 30, 15, 19000000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true),
('1eeebc99-9c0b-4ef8-bb6d-6bb9bd380fff', 'PRD-015', 'ربع سکه', 'Quarter Gold Coin', 'gold', 'coin', 24, 2.033, 300000, 0, 'ربع سکه طلا', 40, 20, 9500000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true),

-- Sets
('1feebc99-9c0b-4ef8-bb6d-6bb9bd381111', 'PRD-016', 'نیم‌ست طلا (گردنبند و گوشواره)', 'Gold Set', 'gold', 'set', 18, 10.5, 5000000, 6000000, 'نیم‌ست طلای 18 عیار شامل گردنبند و گوشواره', 3, 1, 55000000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true),

-- Silver
('20eebc99-9c0b-4ef8-bb6d-6bb9bd382222', 'PRD-017', 'انگشتر نقره', 'Silver Ring', 'silver', 'ring', 18, 4.0, 500000, 1000000, 'انگشتر نقره با نگین', 10, 3, 3500000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true),
('21eebc99-9c0b-4ef8-bb6d-6bb9bd383333', 'PRD-018', 'گردنبند نقره', 'Silver Necklace', 'silver', 'necklace', 18, 8.0, 800000, 0, 'گردنبند نقره ساده', 8, 2, 5000000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true),

-- Low stock items
('22eebc99-9c0b-4ef8-bb6d-6bb9bd384444', 'PRD-019', 'انگشتر طلای نگین یاقوت', 'Ruby Ring', 'gold', 'ring', 18, 4.2, 2200000, 8000000, 'انگشتر طلای 18 عیار با نگین یاقوت', 1, 2, 32000000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true),
('23eebc99-9c0b-4ef8-bb6d-6bb9bd385555', 'PRD-020', 'گردنبند طلای زمرد', 'Emerald Necklace', 'gold', 'necklace', 18, 9.5, 4500000, 12000000, 'گردنبند طلای 18 عیار با نگین زمرد', 2, 3, 62000000, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true);

-- ==========================================
-- SALES
-- ==========================================

INSERT INTO sales (id, sale_number, customer_id, sale_type, payment_method, total_amount, gold_price, discount, tax, final_amount, paid_amount, remaining_amount, status, sale_date, created_by) VALUES
-- Completed sales
('30eebc99-9c0b-4ef8-bb6d-6bb9bd380111', 'ZM-20240101-001', 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'cash', 'cash', 25000000, 3500000, 0, 2250000, 27250000, 27250000, 0, 'completed', CURRENT_TIMESTAMP - INTERVAL '5 days', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'),

('31eebc99-9c0b-4ef8-bb6d-6bb9bd380222', 'ZM-20240102-001', 'f6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'cash', 'card', 48000000, 3500000, 1000000, 4230000, 51230000, 51230000, 0, 'completed', CURRENT_TIMESTAMP - INTERVAL '4 days', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'),

('32eebc99-9c0b-4ef8-bb6d-6bb9bd380333', 'ZM-20240103-001', 'f7eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'cash', 'card', 37500000, 4500000, 0, 3375000, 40875000, 40875000, 0, 'completed', CURRENT_TIMESTAMP - INTERVAL '3 days', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'),

('33eebc99-9c0b-4ef8-bb6d-6bb9bd380444', 'ZM-20240104-001', 'f8eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'installment', 'mixed', 55000000, 3500000, 2000000, 4770000, 57770000, 30000000, 27770000, 'partial', CURRENT_TIMESTAMP - INTERVAL '2 days', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'),

('34eebc99-9c0b-4ef8-bb6d-6bb9bd380555', 'ZM-20240105-001', 'f9eebc99-9c0b-4ef8-bb6d-6bb9bd380aaa', 'cash', 'transfer', 60000000, 3500000, 5000000, 4950000, 59950000, 59950000, 0, 'completed', CURRENT_TIMESTAMP - INTERVAL '1 day', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'),

-- Recent sales (today)
('35eebc99-9c0b-4ef8-bb6d-6bb9bd380666', 'ZM-20240106-001', 'faeebc99-9c0b-4ef8-bb6d-6bb9bd380bbb', 'cash', 'cash', 18500000, 3550000, 0, 1665000, 20165000, 20165000, 0, 'completed', CURRENT_TIMESTAMP - INTERVAL '3 hours', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'),

('36eebc99-9c0b-4ef8-bb6d-6bb9bd380777', 'ZM-20240106-002', 'fbeebc99-9c0b-4ef8-bb6d-6bb9bd380ccc', 'installment', 'card', 35000000, 3550000, 1000000, 3060000, 37060000, 20000000, 17060000, 'partial', CURRENT_TIMESTAMP - INTERVAL '2 hours', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'),

-- Draft (pending)
('37eebc99-9c0b-4ef8-bb6d-6bb9bd380888', 'ZM-20240106-003', 'fceebc99-9c0b-4ef8-bb6d-6bb9bd380ddd', 'cash', 'cash', 28000000, 3550000, 0, 2520000, 30520000, 0, 30520000, 'draft', CURRENT_TIMESTAMP - INTERVAL '30 minutes', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33');

-- ==========================================
-- SALE ITEMS
-- ==========================================

INSERT INTO sale_items (sale_id, product_id, product_name, quantity, weight, carat, unit_price, wage, total_price) VALUES
-- Sale 1 items
('30eebc99-9c0b-4ef8-bb6d-6bb9bd380111', '10eebc99-9c0b-4ef8-bb6d-6bb9bd380111', 'انگشتر طلای زنانه نگین‌دار', 1, 3.5, 18, 25000000, 2000000, 25000000),

-- Sale 2 items
('31eebc99-9c0b-4ef8-bb6d-6bb9bd380222', '14eebc99-9c0b-4ef8-bb6d-6bb9bd380555', 'گردنبند طلای ونیزی', 1, 12.3, 18, 48000000, 4000000, 48000000),

-- Sale 3 items
('32eebc99-9c0b-4ef8-bb6d-6bb9bd380333', '1ceebc99-9c0b-4ef8-bb6d-6bb9bd380ddd', 'سکه امامی', 1, 8.133, 24, 37500000, 500000, 37500000),

-- Sale 4 items
('33eebc99-9c0b-4ef8-bb6d-6bb9bd380444', '1feebc99-9c0b-4ef8-bb6d-6bb9bd381111', 'نیم‌ست طلا (گردنبند و گوشواره)', 1, 10.5, 18, 55000000, 5000000, 55000000),

-- Sale 5 items
('34eebc99-9c0b-4ef8-bb6d-6bb9bd380555', '1aeebc99-9c0b-4ef8-bb6d-6bb9bd380bbb', 'النگو طلای بزرگسال', 1, 15.5, 18, 60000000, 3500000, 60000000),

-- Sale 6 items
('35eebc99-9c0b-4ef8-bb6d-6bb9bd380666', '17eebc99-9c0b-4ef8-bb6d-6bb9bd380888', 'گوشواره طلای حلقه‌ای', 1, 4.5, 18, 18500000, 1800000, 18500000),

-- Sale 7 items (multiple items)
('36eebc99-9c0b-4ef8-bb6d-6bb9bd380777', '16eebc99-9c0b-4ef8-bb6d-6bb9bd380777', 'دستبند طلا با نگین', 1, 7.2, 18, 35000000, 2800000, 35000000),

-- Sale 8 items (draft)
('37eebc99-9c0b-4ef8-bb6d-6bb9bd380888', '15eebc99-9c0b-4ef8-bb6d-6bb9bd380666', 'دستبند طلای زنجیری', 1, 6.7, 18, 28000000, 2500000, 28000000);

-- ==========================================
-- TRANSACTIONS
-- ==========================================

INSERT INTO transactions (transaction_number, customer_id, sale_id, type, amount, payment_method, description, transaction_date, created_by) VALUES
-- Sale payments
('TXN-20240101-001', 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', '30eebc99-9c0b-4ef8-bb6d-6bb9bd380111', 'sale', 27250000, 'cash', 'پرداخت کامل فاکتور ZM-20240101-001', CURRENT_TIMESTAMP - INTERVAL '5 days', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'),

('TXN-20240102-001', 'f6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', '31eebc99-9c0b-4ef8-bb6d-6bb9bd380222', 'sale', 51230000, 'card', 'پرداخت کامل فاکتور ZM-20240102-001', CURRENT_TIMESTAMP - INTERVAL '4 days', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'),

('TXN-20240103-001', 'f7eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', '32eebc99-9c0b-4ef8-bb6d-6bb9bd380333', 'sale', 40875000, 'card', 'پرداخت کامل فاکتور ZM-20240103-001', CURRENT_TIMESTAMP - INTERVAL '3 days', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'),

('TXN-20240104-001', 'f8eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', '33eebc99-9c0b-4ef8-bb6d-6bb9bd380444', 'sale', 30000000, 'mixed', 'پرداخت اولیه فاکتور ZM-20240104-001 (اقساطی)', CURRENT_TIMESTAMP - INTERVAL '2 days', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'),

('TXN-20240105-001', 'f9eebc99-9c0b-4ef8-bb6d-6bb9bd380aaa', '34eebc99-9c0b-4ef8-bb6d-6bb9bd380555', 'sale', 59950000, 'transfer', 'پرداخت کامل فاکتور ZM-20240105-001', CURRENT_TIMESTAMP - INTERVAL '1 day', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'),

('TXN-20240106-001', 'faeebc99-9c0b-4ef8-bb6d-6bb9bd380bbb', '35eebc99-9c0b-4ef8-bb6d-6bb9bd380666', 'sale', 20165000, 'cash', 'پرداخت کامل فاکتور ZM-20240106-001', CURRENT_TIMESTAMP - INTERVAL '3 hours', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'),

('TXN-20240106-002', 'fbeebc99-9c0b-4ef8-bb6d-6bb9bd380ccc', '36eebc99-9c0b-4ef8-bb6d-6bb9bd380777', 'sale', 20000000, 'card', 'پرداخت اولیه فاکتور ZM-20240106-002 (اقساطی)', CURRENT_TIMESTAMP - INTERVAL '2 hours', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'),

-- Additional customer payments (installments, adjustments)
('TXN-20240106-003', 'fdeebc99-9c0b-4ef8-bb6d-6bb9bd380eee', NULL, 'payment', 5000000, 'cash', 'پرداخت بدهی قبلی', CURRENT_TIMESTAMP - INTERVAL '1 hour', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33');

-- ==========================================
-- AUDIT LOGS
-- ==========================================

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent) VALUES
-- Login events
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'login', 'user', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '192.168.1.100', 'Mozilla/5.0'),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'login', 'user', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '192.168.1.101', 'Mozilla/5.0'),
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'login', 'user', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', '192.168.1.102', 'Mozilla/5.0'),

-- Product views
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'view', 'product', '10eebc99-9c0b-4ef8-bb6d-6bb9bd380111', '192.168.1.101', 'Mozilla/5.0'),
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'view', 'product', '1ceebc99-9c0b-4ef8-bb6d-6bb9bd380ddd', '192.168.1.102', 'Mozilla/5.0'),

-- Sale creation
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'create', 'sale', '30eebc99-9c0b-4ef8-bb6d-6bb9bd380111', '192.168.1.101', 'Mozilla/5.0'),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'create', 'sale', '31eebc99-9c0b-4ef8-bb6d-6bb9bd380222', '192.168.1.101', 'Mozilla/5.0'),
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'create', 'sale', '32eebc99-9c0b-4ef8-bb6d-6bb9bd380333', '192.168.1.102', 'Mozilla/5.0');

COMMIT;

-- ==========================================
-- DATA VERIFICATION
-- ==========================================

DO $$
DECLARE
  user_count INTEGER;
  customer_count INTEGER;
  product_count INTEGER;
  sale_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO customer_count FROM customers;
  SELECT COUNT(*) INTO product_count FROM products;
  SELECT COUNT(*) INTO sale_count FROM sales;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Zarmind Initial Data Seeded Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users: %', user_count;
  RAISE NOTICE 'Customers: %', customer_count;
  RAISE NOTICE 'Products: %', product_count;
  RAISE NOTICE 'Sales: %', sale_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Default Login Credentials:';
  RAISE NOTICE 'Username: admin | Password: password123';
  RAISE NOTICE 'Username: manager1 | Password: password123';
  RAISE NOTICE 'Username: employee1 | Password: password123';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'IMPORTANT: Change default passwords!';
  RAISE NOTICE '========================================';
END $$;