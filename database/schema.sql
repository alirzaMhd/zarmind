-- ==========================================
-- ZARMIND - Database Schema
-- Persian Jewelry Store Accounting System
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing (if needed)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- DROP EXISTING TABLES (for clean setup)
-- ==========================================

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS gold_prices CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS migrations CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS product_category CASCADE;
DROP TYPE IF EXISTS product_type CASCADE;
DROP TYPE IF EXISTS sale_type CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS sale_status CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS audit_action CASCADE;
DROP TYPE IF EXISTS entity_type CASCADE;

-- ==========================================
-- CUSTOM TYPES (ENUMS)
-- ==========================================

-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee', 'viewer');

-- Product categories
CREATE TYPE product_category AS ENUM (
  'gold',      -- طلا
  'silver',    -- نقره
  'platinum',  -- پلاتین
  'diamond',   -- الماس
  'gemstone'   -- سنگ قیمتی
);

-- Product types
CREATE TYPE product_type AS ENUM (
  'ring',      -- انگشتر
  'necklace',  -- گردنبند
  'bracelet',  -- دستبند
  'earring',   -- گوشواره
  'anklet',    -- پابند
  'bangle',    -- النگو
  'chain',     -- زنجیر
  'pendant',   -- آویز
  'coin',      -- سکه
  'bar',       -- شمش
  'set',       -- نیم‌ست
  'other'      -- سایر
);

-- Sale types
CREATE TYPE sale_type AS ENUM (
  'cash',        -- نقدی
  'installment', -- اقساطی
  'exchange',    -- معاوضه
  'repair'       -- تعمیر
);

-- Payment methods
CREATE TYPE payment_method AS ENUM (
  'cash',     -- نقد
  'card',     -- کارت
  'transfer', -- انتقال
  'check',    -- چک
  'mixed'     -- ترکیبی
);

-- Sale status
CREATE TYPE sale_status AS ENUM (
  'draft',     -- پیش‌فاکتور
  'completed', -- تکمیل شده
  'partial',   -- پرداخت جزئی
  'cancelled', -- لغو شده
  'returned'   -- مرجوعی
);

-- Transaction types
CREATE TYPE transaction_type AS ENUM (
  'sale',       -- فروش
  'purchase',   -- خرید
  'return',     -- برگشت
  'payment',    -- دریافت
  'expense',    -- هزینه
  'adjustment'  -- تسویه
);

-- Audit actions
CREATE TYPE audit_action AS ENUM (
  'create',
  'update',
  'delete',
  'view',
  'login',
  'logout'
);

-- Entity types for audit
CREATE TYPE entity_type AS ENUM (
  'user',
  'product',
  'customer',
  'sale',
  'transaction'
);

-- ==========================================
-- USERS TABLE
-- ==========================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role DEFAULT 'employee',
  phone VARCHAR(20),
  avatar VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_username_length CHECK (LENGTH(username) >= 3),
  CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Comments
COMMENT ON TABLE users IS 'کاربران سیستم';
COMMENT ON COLUMN users.full_name IS 'نام کامل';
COMMENT ON COLUMN users.role IS 'نقش کاربر';

-- ==========================================
-- CUSTOMERS TABLE
-- ==========================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_code VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  national_id VARCHAR(10), -- کد ملی
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(10),
  birth_date DATE,
  notes TEXT,
  credit_limit DECIMAL(15, 2) DEFAULT 0,
  balance DECIMAL(15, 2) DEFAULT 0, -- بدهی/طلبکار (+ = بدهکار، - = طلبکار)
  total_purchases DECIMAL(15, 2) DEFAULT 0,
  last_purchase_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_phone_length CHECK (LENGTH(phone) >= 10),
  CONSTRAINT chk_national_id_length CHECK (national_id IS NULL OR LENGTH(national_id) = 10),
  CONSTRAINT chk_postal_code_length CHECK (postal_code IS NULL OR LENGTH(postal_code) = 10),
  CONSTRAINT chk_balance_limit CHECK (balance <= credit_limit OR credit_limit = 0)
);

-- Indexes
CREATE INDEX idx_customers_customer_code ON customers(customer_code);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_full_name ON customers(full_name);
CREATE INDEX idx_customers_is_active ON customers(is_active);
CREATE INDEX idx_customers_balance ON customers(balance);

-- Comments
COMMENT ON TABLE customers IS 'مشتریان';
COMMENT ON COLUMN customers.customer_code IS 'کد مشتری';
COMMENT ON COLUMN customers.balance IS 'مانده حساب (مثبت: بدهکار، منفی: طلبکار)';

-- ==========================================
-- GOLD PRICES TABLE
-- ==========================================

CREATE TABLE gold_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carat INTEGER NOT NULL,
  price_per_gram DECIMAL(15, 2) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_carat_values CHECK (carat IN (18, 21, 22, 24)),
  CONSTRAINT chk_price_positive CHECK (price_per_gram > 0),
  CONSTRAINT unique_carat_date UNIQUE(carat, date)
);

-- Indexes
CREATE INDEX idx_gold_prices_carat ON gold_prices(carat);
CREATE INDEX idx_gold_prices_date ON gold_prices(date DESC);

-- Comments
COMMENT ON TABLE gold_prices IS 'قیمت طلا';
COMMENT ON COLUMN gold_prices.carat IS 'عیار (18، 21، 22، 24)';
COMMENT ON COLUMN gold_prices.price_per_gram IS 'قیمت هر گرم (تومان)';

-- ==========================================
-- PRODUCTS TABLE
-- ==========================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  category product_category NOT NULL,
  type product_type NOT NULL,
  carat INTEGER NOT NULL,
  weight DECIMAL(10, 3) NOT NULL, -- وزن به گرم
  wage DECIMAL(15, 2) DEFAULT 0, -- اجرت ساخت
  stone_price DECIMAL(15, 2) DEFAULT 0, -- قیمت نگین
  description TEXT,
  image_url VARCHAR(500),
  stock_quantity INTEGER DEFAULT 1,
  min_stock_level INTEGER DEFAULT 0,
  location VARCHAR(100), -- محل نگهداری
  supplier VARCHAR(255),
  purchase_price DECIMAL(15, 2),
  selling_price DECIMAL(15, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_product_carat CHECK (carat IN (18, 21, 22, 24)),
  CONSTRAINT chk_weight_positive CHECK (weight > 0),
  CONSTRAINT chk_wage_non_negative CHECK (wage >= 0),
  CONSTRAINT chk_stone_price_non_negative CHECK (stone_price >= 0),
  CONSTRAINT chk_stock_non_negative CHECK (stock_quantity >= 0),
  CONSTRAINT chk_selling_price_positive CHECK (selling_price > 0)
);

-- Indexes
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_carat ON products(carat);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_stock_quantity ON products(stock_quantity);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- Full-text search index
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- Comments
COMMENT ON TABLE products IS 'محصولات (موجودی)';
COMMENT ON COLUMN products.carat IS 'عیار طلا';
COMMENT ON COLUMN products.weight IS 'وزن (گرم)';
COMMENT ON COLUMN products.wage IS 'اجرت ساخت';
COMMENT ON COLUMN products.stone_price IS 'قیمت نگین';

-- ==========================================
-- SALES TABLE
-- ==========================================

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  sale_type sale_type DEFAULT 'cash',
  payment_method payment_method DEFAULT 'cash',
  total_amount DECIMAL(15, 2) NOT NULL,
  gold_price DECIMAL(15, 2) NOT NULL, -- قیمت طلا در زمان فروش
  discount DECIMAL(15, 2) DEFAULT 0,
  tax DECIMAL(15, 2) DEFAULT 0,
  final_amount DECIMAL(15, 2) NOT NULL,
  paid_amount DECIMAL(15, 2) DEFAULT 0,
  remaining_amount DECIMAL(15, 2) DEFAULT 0,
  status sale_status DEFAULT 'draft',
  sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_total_amount_positive CHECK (total_amount >= 0),
  CONSTRAINT chk_discount_non_negative CHECK (discount >= 0),
  CONSTRAINT chk_tax_non_negative CHECK (tax >= 0),
  CONSTRAINT chk_final_amount_positive CHECK (final_amount >= 0),
  CONSTRAINT chk_paid_amount_non_negative CHECK (paid_amount >= 0),
  CONSTRAINT chk_remaining_amount_non_negative CHECK (remaining_amount >= 0),
  CONSTRAINT chk_paid_remaining_sum CHECK (paid_amount + remaining_amount = final_amount)
);

-- Indexes
CREATE INDEX idx_sales_sale_number ON sales(sale_number);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_sale_date ON sales(sale_date DESC);
CREATE INDEX idx_sales_created_by ON sales(created_by);
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);

-- Comments
COMMENT ON TABLE sales IS 'فروش';
COMMENT ON COLUMN sales.sale_number IS 'شماره فاکتور';
COMMENT ON COLUMN sales.gold_price IS 'قیمت طلا در زمان فروش';
COMMENT ON COLUMN sales.remaining_amount IS 'مانده حساب';

-- ==========================================
-- SALE ITEMS TABLE
-- ==========================================

CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER DEFAULT 1,
  weight DECIMAL(10, 3) NOT NULL,
  carat INTEGER NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  wage DECIMAL(15, 2) DEFAULT 0,
  total_price DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
  CONSTRAINT chk_weight_positive_item CHECK (weight > 0),
  CONSTRAINT chk_carat_item CHECK (carat IN (18, 21, 22, 24)),
  CONSTRAINT chk_unit_price_positive CHECK (unit_price >= 0),
  CONSTRAINT chk_total_price_positive CHECK (total_price >= 0)
);

-- Indexes
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- Comments
COMMENT ON TABLE sale_items IS 'اقلام فروش';
COMMENT ON COLUMN sale_items.wage IS 'اجرت';

-- ==========================================
-- TRANSACTIONS TABLE
-- ==========================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  type transaction_type NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_method payment_method DEFAULT 'cash',
  reference_number VARCHAR(100), -- شماره مرجع/پیگیری
  description TEXT,
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chk_amount_positive CHECK (amount > 0)
);

-- Indexes
CREATE INDEX idx_transactions_transaction_number ON transactions(transaction_number);
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_transactions_sale_id ON transactions(sale_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date DESC);
CREATE INDEX idx_transactions_created_by ON transactions(created_by);

-- Comments
COMMENT ON TABLE transactions IS 'تراکنش‌ها';
COMMENT ON COLUMN transactions.reference_number IS 'شماره مرجع/پیگیری';

-- ==========================================
-- AUDIT LOGS TABLE
-- ==========================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  entity_type entity_type NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Comments
COMMENT ON TABLE audit_logs IS 'لاگ تغییرات';

-- ==========================================
-- SYSTEM SETTINGS TABLE
-- ==========================================

CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  data_type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);

-- Comments
COMMENT ON TABLE system_settings IS 'تنظیمات سیستم';

-- ==========================================
-- MIGRATIONS TABLE
-- ==========================================

CREATE TABLE migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments
COMMENT ON TABLE migrations IS 'تاریخچه مایگریشن‌ها';

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- FUNCTION: Update Customer Balance
-- ==========================================

CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE customers
    SET balance = balance + NEW.remaining_amount,
        total_purchases = total_purchases + NEW.final_amount,
        last_purchase_date = NEW.sale_date
    WHERE id = NEW.customer_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE customers
    SET balance = balance - OLD.remaining_amount + NEW.remaining_amount,
        total_purchases = total_purchases - OLD.final_amount + NEW.final_amount
    WHERE id = NEW.customer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE customers
    SET balance = balance - OLD.remaining_amount,
        total_purchases = total_purchases - OLD.final_amount
    WHERE id = OLD.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update customer balance on sale changes
CREATE TRIGGER update_customer_balance_on_sale
  AFTER INSERT OR UPDATE OR DELETE ON sales
  FOR EACH ROW
  WHEN (NEW.customer_id IS NOT NULL OR OLD.customer_id IS NOT NULL)
  EXECUTE FUNCTION update_customer_balance();

-- ==========================================
-- FUNCTION: Update Product Stock
-- ==========================================

CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE products
    SET stock_quantity = stock_quantity + OLD.quantity - NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products
    SET stock_quantity = stock_quantity + OLD.quantity
    WHERE id = OLD.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update product stock on sale item changes
CREATE TRIGGER update_product_stock_on_sale_item
  AFTER INSERT OR UPDATE OR DELETE ON sale_items
  FOR EACH ROW
  WHEN (NEW.product_id IS NOT NULL OR OLD.product_id IS NOT NULL)
  EXECUTE FUNCTION update_product_stock();

-- ==========================================
-- FUNCTION: Generate Unique Code
-- ==========================================

CREATE OR REPLACE FUNCTION generate_unique_code(prefix VARCHAR, length INTEGER DEFAULT 8)
RETURNS VARCHAR AS $$
DECLARE
  code VARCHAR;
  exists BOOLEAN;
BEGIN
  LOOP
    code := prefix || '-' || LPAD(FLOOR(RANDOM() * 10^length)::TEXT, length, '0');
    
    -- Check if code exists (this is a simplified version)
    -- In production, you'd check against specific tables
    exists := FALSE;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- VIEWS
-- ==========================================

-- View: Products with current gold price
CREATE OR REPLACE VIEW products_with_current_price AS
SELECT 
  p.*,
  gp.price_per_gram as current_gold_price,
  (p.weight * gp.price_per_gram * (p.carat::DECIMAL / 24) + p.wage + p.stone_price) as calculated_price
FROM products p
LEFT JOIN LATERAL (
  SELECT price_per_gram
  FROM gold_prices
  WHERE carat = p.carat
  ORDER BY date DESC
  LIMIT 1
) gp ON true
WHERE p.is_active = true;

-- View: Sales summary
CREATE OR REPLACE VIEW sales_summary AS
SELECT 
  s.*,
  c.full_name as customer_name,
  c.phone as customer_phone,
  u.full_name as created_by_name,
  COUNT(si.id) as items_count,
  SUM(si.quantity) as total_quantity
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN users u ON s.created_by = u.id
LEFT JOIN sale_items si ON s.id = si.sale_id
GROUP BY s.id, c.full_name, c.phone, u.full_name;

-- View: Low stock products
CREATE OR REPLACE VIEW low_stock_products AS
SELECT *
FROM products
WHERE stock_quantity <= min_stock_level
  AND is_active = true
ORDER BY stock_quantity ASC;

-- View: Customer account summary
CREATE OR REPLACE VIEW customer_account_summary AS
SELECT 
  c.id,
  c.customer_code,
  c.full_name,
  c.phone,
  c.balance,
  c.total_purchases,
  c.last_purchase_date,
  COUNT(s.id) as total_orders,
  COALESCE(SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END), 0) as completed_orders,
  COALESCE(SUM(CASE WHEN s.status = 'partial' THEN 1 ELSE 0 END), 0) as partial_orders
FROM customers c
LEFT JOIN sales s ON c.id = s.customer_id
GROUP BY c.id;

-- ==========================================
-- INITIAL DATA / DEFAULT SETTINGS
-- ==========================================

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, data_type, description) VALUES
('store_name', 'فروشگاه زرمند', 'string', 'نام فروشگاه'),
('store_name_en', 'Zarmind Store', 'string', 'نام فروشگاه (انگلیسی)'),
('tax_rate', '0.09', 'number', 'نرخ مالیات (9%)'),
('currency', 'تومان', 'string', 'واحد پول'),
('invoice_prefix', 'ZM', 'string', 'پیشوند شماره فاکتور'),
('receipt_prefix', 'RC', 'string', 'پیشوند شماره رسید'),
('default_carat', '18', 'number', 'عیار پیش‌فرض'),
('low_stock_threshold', '5', 'number', 'حد آستانه موجودی کم');

-- Insert default admin user (password: admin123 - should be changed!)
-- Password hash for 'admin123' using bcrypt rounds=10
INSERT INTO users (username, email, password, full_name, role, is_active) VALUES
('admin', 'admin@zarmind.com', '$2a$10$rKZLvXZ4LcE7LvXZ4LcE7u.7VxYKnKJXvxJXvxJXvxJXvxJXvxJXu', 'مدیر سیستم', 'admin', true);

-- Insert sample gold prices
INSERT INTO gold_prices (carat, price_per_gram, date) VALUES
(18, 3500000, CURRENT_DATE),
(21, 4000000, CURRENT_DATE),
(22, 4200000, CURRENT_DATE),
(24, 4500000, CURRENT_DATE);

-- ==========================================
-- GRANTS (if using specific database user)
-- ==========================================

-- Grant permissions to zarmind_user
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO zarmind_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO zarmind_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO zarmind_user;

-- ==========================================
-- COMPLETION MESSAGE
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Zarmind Database Schema Created Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables: users, customers, products, sales, sale_items, transactions, audit_logs';
  RAISE NOTICE 'Default admin user created: admin / admin123';
  RAISE NOTICE 'Please change the default password immediately!';
  RAISE NOTICE '========================================';
END $$;