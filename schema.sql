-- Cloudflare D1 Schema for Teen Liwa Store

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  fname TEXT NOT NULL,
  lname TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  address TEXT NOT NULL,
  emirate TEXT NOT NULL,
  total_orders INTEGER DEFAULT 1,
  total_spent REAL DEFAULT 0.0,
  last_order_tracking TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  tracking_number TEXT NOT NULL UNIQUE,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  emirate TEXT NOT NULL,
  address TEXT NOT NULL,
  items TEXT NOT NULL,
  subtotal REAL NOT NULL,
  delivery_fee REAL NOT NULL,
  total REAL NOT NULL,
  payment_method TEXT DEFAULT 'cod',
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL,
  is_verified INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  image_url TEXT,
  seed_key TEXT,
  available INTEGER DEFAULT 1,
  category_id TEXT,
  sort_order INTEGER DEFAULT 1,
  minimum_order_quantity INTEGER DEFAULT 1,
  maximum_order_quantity INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
