/*
# DealFinder V1 - Core Database Schema

Creates the foundational tables for the DealFinder shopping intelligence platform.

## Tables Created:
1. **categories** - Product categories (smartphones, laptops, etc.)
2. **marketplaces** - Marketplace entities (Shopee, Tokopedia, Lazada, etc.)
3. **sellers** - Sellers on marketplaces
4. **products** - Product catalog with brand/model/category
5. **offers** - Marketplace offers for products (price, seller, shipping, warranty)
6. **price_history** - Append-only historical price records per offer
7. **wishlists** - User's saved products
8. **price_alerts** - User's target price alerts
9. **searches** - Search query tracking
10. **affiliate_clicks** - Click tracking for affiliate links
11. **admin_users** - Admin role mapping for auth users

## Security:
- RLS enabled on all tables
- Public read access on catalog tables (products, offers, categories, marketplaces, sellers, price_history) for anon+authenticated
- User-scoped CRUD on wishlists and price_alerts (user_id defaults to auth.uid())
- Insert access on searches and affiliate_clicks for anon+authenticated
- Admin-only access on admin_users table
*/

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_categories" ON categories;
CREATE POLICY "read_categories" ON categories FOR SELECT TO anon, authenticated USING (true);

-- Marketplaces
CREATE TABLE IF NOT EXISTS marketplaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  logo_url text,
  color text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marketplaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_marketplaces" ON marketplaces;
CREATE POLICY "read_marketplaces" ON marketplaces FOR SELECT TO anon, authenticated USING (true);

-- Sellers
CREATE TABLE IF NOT EXISTS sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id uuid REFERENCES marketplaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  rating numeric(2,1) DEFAULT 0,
  review_count integer DEFAULT 0,
  is_official boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_sellers" ON sellers;
CREATE POLICY "read_sellers" ON sellers FOR SELECT TO anon, authenticated USING (true);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  variant text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  description text,
  image_url text,
  reference_price numeric(14,2),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_products" ON products;
CREATE POLICY "read_products" ON products FOR SELECT TO anon, authenticated USING (true);

-- Offers
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  marketplace_id uuid NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES sellers(id) ON DELETE SET NULL,
  price numeric(14,2) NOT NULL,
  shipping_cost numeric(10,2) DEFAULT 0,
  seller_rating numeric(2,1) DEFAULT 0,
  review_count integer DEFAULT 0,
  warranty text,
  return_policy text,
  product_url text,
  affiliate_url text,
  is_sponsored boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_offers" ON offers;
CREATE POLICY "read_offers" ON offers FOR SELECT TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_offers_product ON offers(product_id);
CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(active);

-- Price History (append-only)
CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  price numeric(14,2) NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_price_history" ON price_history;
CREATE POLICY "read_price_history" ON price_history FOR SELECT TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_price_history_offer ON price_history(offer_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded ON price_history(recorded_at);

-- Wishlists (user-scoped)
CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_wishlists" ON wishlists;
CREATE POLICY "select_own_wishlists" ON wishlists FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_wishlists" ON wishlists;
CREATE POLICY "insert_own_wishlists" ON wishlists FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_wishlists" ON wishlists;
CREATE POLICY "delete_own_wishlists" ON wishlists FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Price Alerts (user-scoped)
CREATE TABLE IF NOT EXISTS price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  target_price numeric(14,2) NOT NULL,
  active boolean DEFAULT true,
  triggered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_alerts" ON price_alerts;
CREATE POLICY "select_own_alerts" ON price_alerts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_alerts" ON price_alerts;
CREATE POLICY "insert_own_alerts" ON price_alerts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_alerts" ON price_alerts;
CREATE POLICY "update_own_alerts" ON price_alerts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_alerts" ON price_alerts;
CREATE POLICY "delete_own_alerts" ON price_alerts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Searches (tracking)
CREATE TABLE IF NOT EXISTS searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  query text NOT NULL,
  normalized_query text,
  results_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_searches" ON searches;
CREATE POLICY "insert_searches" ON searches FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "select_own_searches" ON searches;
CREATE POLICY "select_own_searches" ON searches FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- Affiliate Clicks (tracking)
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  marketplace_id uuid REFERENCES marketplaces(id) ON DELETE SET NULL,
  clicked_at timestamptz DEFAULT now()
);

ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_affiliate_clicks" ON affiliate_clicks;
CREATE POLICY "insert_affiliate_clicks" ON affiliate_clicks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_admin_status" ON admin_users;
CREATE POLICY "read_own_admin_status" ON admin_users FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
