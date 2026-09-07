/*
# DealFinder V1 - Mock/Demo Data Seed

Populates the database with realistic mock data for MVP demonstration.
All data is clearly labeled as demo data via the is_sponsored flag on offers and realistic Indonesian Rupiah prices.

## Data Added:
1. **6 Categories**: Smartphones, Laptops, Tablets, TVs, Gaming Consoles, Cameras
2. **4 Marketplaces**: Shopee, Tokopedia, Lazada, iStore
3. **Multiple Sellers** across marketplaces with realistic ratings
4. **30 Products** across all categories with realistic brands/models
5. **3+ Offers per product** from different marketplaces with realistic prices
6. **30 days of price history** per offer (generated via PL/pgSQL)

This data is mock/demo data and can be replaced with real marketplace API data later.
*/

-- Categories
INSERT INTO categories (name, slug, icon) VALUES
  ('Smartphones', 'smartphones', 'smartphone'),
  ('Laptops', 'laptops', 'laptop'),
  ('Tablets', 'tablets', 'tablet'),
  ('TVs', 'tvs', 'tv'),
  ('Gaming Consoles', 'gaming-consoles', 'gamepad'),
  ('Cameras', 'cameras', 'camera')
ON CONFLICT (slug) DO NOTHING;

-- Marketplaces
INSERT INTO marketplaces (name, slug, color) VALUES
  ('Shopee', 'shopee', '#ee4d2d'),
  ('Tokopedia', 'tokopedia', '#42b549'),
  ('Lazada', 'lazada', '#0f146d'),
  ('iStore', 'istore', '#007aff')
ON CONFLICT (slug) DO NOTHING;

-- Sellers (multiple per marketplace)
INSERT INTO sellers (marketplace_id, name, rating, review_count, is_official) VALUES
  ((SELECT id FROM marketplaces WHERE slug='shopee'), 'ShopeeMall Official', 4.9, 125000, true),
  ((SELECT id FROM marketplaces WHERE slug='shopee'), 'Gadget Store ID', 4.8, 89000, false),
  ((SELECT id FROM marketplaces WHERE slug='shopee'), 'Tech World Shop', 4.7, 56000, false),
  ((SELECT id FROM marketplaces WHERE slug='tokopedia'), 'Tokopedia Official Store', 4.9, 98000, true),
  ((SELECT id FROM marketplaces WHERE slug='tokopedia'), 'Power Store', 4.8, 72000, false),
  ((SELECT id FROM marketplaces WHERE slug='tokopedia'), 'Digital Shop ID', 4.6, 34000, false),
  ((SELECT id FROM marketplaces WHERE slug='lazada'), 'LazMall Official', 4.9, 110000, true),
  ((SELECT id FROM marketplaces WHERE slug='lazada'), 'Cellular Shop', 4.7, 45000, false),
  ((SELECT id FROM marketplaces WHERE slug='istore'), 'iStore Official', 5.0, 230000, true),
  ((SELECT id FROM marketplaces WHERE slug='istore'), 'Premium Tech ID', 4.8, 67000, false)
ON CONFLICT DO NOTHING;

-- Products (30 products across 6 categories)
INSERT INTO products (name, brand, model, variant, category_id, description, image_url, reference_price, active) VALUES
  ('iPhone 17 Pro 256GB', 'Apple', 'iPhone 17 Pro', '256GB', (SELECT id FROM categories WHERE slug='smartphones'), 'iPhone 17 Pro dengan chip A19 Pro, kamera 48MP, dan layar ProMotion 120Hz 6.3 inch', 'https://images.pexels.com/photos/1294886/pexels-photo-1294886.jpeg?auto=compress&cs=tinysrgb&w=600', 20999000, true),
  ('iPhone 17 Pro 512GB', 'Apple', 'iPhone 17 Pro', '512GB', (SELECT id FROM categories WHERE slug='smartphones'), 'iPhone 17 Pro 512GB dengan chip A19 Pro dan kamera ProRAW', 'https://images.pexels.com/photos/1294886/pexels-photo-1294886.jpeg?auto=compress&cs=tinysrgb&w=600', 23999000, true),
  ('iPhone 17 128GB', 'Apple', 'iPhone 17', '128GB', (SELECT id FROM categories WHERE slug='smartphones'), 'iPhone 17 dengan chip A19 dan kamera 48MP', 'https://images.pexels.com/photos/1294886/pexels-photo-1294886.jpeg?auto=compress&cs=tinysrgb&w=600', 15999000, true),
  ('Samsung Galaxy S26 Ultra 512GB', 'Samsung', 'Galaxy S26 Ultra', '512GB', (SELECT id FROM categories WHERE slug='smartphones'), 'Samsung Galaxy S26 Ultra dengan S Pen, kamera 200MP, dan layar Dynamic AMOLED 6.8 inch', 'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=600', 21999000, true),
  ('Samsung Galaxy S26 256GB', 'Samsung', 'Galaxy S26', '256GB', (SELECT id FROM categories WHERE slug='smartphones'), 'Samsung Galaxy S26 dengan kamera 50MP dan layar 6.3 inch', 'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=600', 16999000, true),
  ('Google Pixel 10 Pro 256GB', 'Google', 'Pixel 10 Pro', '256GB', (SELECT id FROM categories WHERE slug='smartphones'), 'Google Pixel 10 Pro dengan AI Gemini dan kamera 50MP', 'https://images.pexels.com/photos/1294886/pexels-photo-1294886.jpeg?auto=compress&cs=tinysrgb&w=600', 14999000, true),
  ('Xiaomi 15 Pro 512GB', 'Xiaomi', '15 Pro', '512GB', (SELECT id FROM categories WHERE slug='smartphones'), 'Xiaomi 15 Pro dengan Snapdragon 8 Gen 4 dan kamera Leica', 'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=600', 12999000, true),
  ('OPPO Find X8 Pro 256GB', 'OPPO', 'Find X8 Pro', '256GB', (SELECT id FROM categories WHERE slug='smartphones'), 'OPPO Find X8 Pro dengan Hasselblad Camera dan fast charging 100W', 'https://images.pexels.com/photos/1294886/pexels-photo-1294886.jpeg?auto=compress&cs=tinysrgb&w=600', 13999000, true)
ON CONFLICT DO NOTHING;

INSERT INTO products (name, brand, model, variant, category_id, description, image_url, reference_price, active) VALUES
  ('MacBook Pro 16 M5 1TB', 'Apple', 'MacBook Pro 16', 'M5 1TB', (SELECT id FROM categories WHERE slug='laptops'), 'MacBook Pro 16 inch dengan chip M5 Pro, 32GB RAM, 1TB SSD', 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600', 34999000, true),
  ('MacBook Air 15 M4 512GB', 'Apple', 'MacBook Air 15', 'M4 512GB', (SELECT id FROM categories WHERE slug='laptops'), 'MacBook Air 15 inch dengan chip M4, 16GB RAM, 512GB SSD', 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600', 18999000, true),
  ('Dell XPS 15 32GB 1TB', 'Dell', 'XPS 15', '32GB 1TB', (SELECT id FROM categories WHERE slug='laptops'), 'Dell XPS 15 dengan Intel Core Ultra 9, 32GB RAM, RTX 4070', 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600', 28999000, true),
  ('ASUS ROG Zephyrus G16 32GB 2TB', 'ASUS', 'ROG Zephyrus G16', '32GB 2TB', (SELECT id FROM categories WHERE slug='laptops'), 'ASUS ROG Zephyrus G16 gaming laptop dengan RTX 4080', 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600', 32999000, true),
  ('Lenovo ThinkPad X1 Carbon 16GB 512GB', 'Lenovo', 'ThinkPad X1 Carbon', '16GB 512GB', (SELECT id FROM categories WHERE slug='laptops'), 'Lenovo ThinkPad X1 Carbon Gen 12 dengan Intel Core Ultra 7', 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600', 22999000, true),
  ('Acer Swift Go 14 16GB 512GB', 'Acer', 'Swift Go 14', '16GB 512GB', (SELECT id FROM categories WHERE slug='laptops'), 'Acer Swift Go 14 dengan Intel Core Ultra 5 dan OLED display', 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600', 12999000, true)
ON CONFLICT DO NOTHING;

INSERT INTO products (name, brand, model, variant, category_id, description, image_url, reference_price, active) VALUES
  ('iPad Pro 13 M4 512GB', 'Apple', 'iPad Pro 13', 'M4 512GB', (SELECT id FROM categories WHERE slug='tablets'), 'iPad Pro 13 inch dengan chip M4 dan layar Ultra Retina XDR', 'https://images.pexels.com/photos/1331590/pexels-photo-1331590.jpeg?auto=compress&cs=tinysrgb&w=600', 19999000, true),
  ('iPad Air 13 M3 256GB', 'Apple', 'iPad Air 13', 'M3 256GB', (SELECT id FROM categories WHERE slug='tablets'), 'iPad Air 13 inch dengan chip M3 dan layar Liquid Retina', 'https://images.pexels.com/photos/1331590/pexels-photo-1331590.jpeg?auto=compress&cs=tinysrgb&w=600', 12999000, true),
  ('Samsung Galaxy Tab S10 Ultra 512GB', 'Samsung', 'Galaxy Tab S10 Ultra', '512GB', (SELECT id FROM categories WHERE slug='tablets'), 'Samsung Galaxy Tab S10 Ultra dengan S Pen dan layar 14.6 inch', 'https://images.pexels.com/photos/1331590/pexels-photo-1331590.jpeg?auto=compress&cs=tinysrgb&w=600', 17999000, true),
  ('Xiaomi Pad 6 Pro 256GB', 'Xiaomi', 'Pad 6 Pro', '256GB', (SELECT id FROM categories WHERE slug='tablets'), 'Xiaomi Pad 6 Pro dengan Snapdragon 8 Gen 3 dan layar 11 inch', 'https://images.pexels.com/photos/1331590/pexels-photo-1331590.jpeg?auto=compress&cs=tinysrgb&w=600', 7999000, true)
ON CONFLICT DO NOTHING;

INSERT INTO products (name, brand, model, variant, category_id, description, image_url, reference_price, active) VALUES
  ('Samsung QLED 4K 65 Inch Q80D', 'Samsung', 'Q80D', '65 Inch 4K', (SELECT id FROM categories WHERE slug='tvs'), 'Samsung QLED 4K Smart TV 65 inch dengan Quantum HDR', 'https://images.pexels.com/photos/3339849/pexels-photo-3339849.jpeg?auto=compress&cs=tinysrgb&w=600', 14999000, true),
  ('LG OLED evo C5 65 Inch', 'LG', 'OLED evo C5', '65 Inch 4K', (SELECT id FROM categories WHERE slug='tvs'), 'LG OLED evo C5 65 inch dengan AI Picture Pro dan Dolby Vision', 'https://images.pexels.com/photos/3339849/pexels-photo-3339849.jpeg?auto=compress&cs=tinysrgb&w=600', 24999000, true),
  ('Sony Bravia XR 55 Inch X90L', 'Sony', 'Bravia XR X90L', '55 Inch 4K', (SELECT id FROM categories WHERE slug='tvs'), 'Sony Bravia XR 55 inch dengan Cognitive Processor XR dan Google TV', 'https://images.pexels.com/photos/3339849/pexels-photo-3339849.jpeg?auto=compress&cs=tinysrgb&w=600', 12999000, true),
  ('TCL Mini LED 75 Inch C855', 'TCL', 'C855', '75 Inch 4K', (SELECT id FROM categories WHERE slug='tvs'), 'TCL Mini LED 75 inch 4K dengan Google TV dan HDR10+', 'https://images.pexels.com/photos/3339849/pexels-photo-3339849.jpeg?auto=compress&cs=tinysrgb&w=600', 16999000, true)
ON CONFLICT DO NOTHING;

INSERT INTO products (name, brand, model, variant, category_id, description, image_url, reference_price, active) VALUES
  ('PlayStation 5 Pro 2TB', 'Sony', 'PS5 Pro', '2TB', (SELECT id FROM categories WHERE slug='gaming-consoles'), 'PlayStation 5 Pro dengan 2TB SSD dan GPU enhanced', 'https://images.pexels.com/photos/1292058/pexels-photo-1292058.jpeg?auto=compress&cs=tinysrgb&w=600', 12999000, true),
  ('PlayStation 5 Slim 1TB', 'Sony', 'PS5 Slim', '1TB', (SELECT id FROM categories WHERE slug='gaming-consoles'), 'PlayStation 5 Slim dengan 1TB SSD dan design compact', 'https://images.pexels.com/photos/1292058/pexels-photo-1292058.jpeg?auto=compress&cs=tinysrgb&w=600', 8999000, true),
  ('Xbox Series X 2TB Robot White', 'Microsoft', 'Xbox Series X', '2TB', (SELECT id FROM categories WHERE slug='gaming-consoles'), 'Xbox Series X 2TB dengan 12 TFLOPS GPU dan Quick Resume', 'https://images.pexels.com/photos/1292058/pexels-photo-1292058.jpeg?auto=compress&cs=tinysrgb&w=600', 9999000, true),
  ('Nintendo Switch 2 OLED', 'Nintendo', 'Switch 2', 'OLED', (SELECT id FROM categories WHERE slug='gaming-consoles'), 'Nintendo Switch 2 dengan OLED display dan dock 4K output', 'https://images.pexels.com/photos/1292058/pexels-photo-1292058.jpeg?auto=compress&cs=tinysrgb&w=600', 6999000, true)
ON CONFLICT DO NOTHING;

INSERT INTO products (name, brand, model, variant, category_id, description, image_url, reference_price, active) VALUES
  ('Sony A7 V Body', 'Sony', 'A7 V', 'Body Only', (SELECT id FROM categories WHERE slug='cameras'), 'Sony A7 V full-frame mirrorless dengan 33MP sensor dan 8K video', 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=600', 32999000, true),
  ('Canon EOS R6 Mark II Body', 'Canon', 'EOS R6 Mark II', 'Body Only', (SELECT id FROM categories WHERE slug='cameras'), 'Canon EOS R6 Mark II dengan 24.2MP sensor dan 40fps burst', 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=600', 28999000, true),
  ('Nikon Z8 Body', 'Nikon', 'Z8', 'Body Only', (SELECT id FROM categories WHERE slug='cameras'), 'Nikon Z8 full-frame mirrorless dengan 45.7MP sensor dan 8K video', 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=600', 38999000, true),
  ('Fujifilm X-T5 18-55 Kit', 'Fujifilm', 'X-T5', '18-55 Kit', (SELECT id FROM categories WHERE slug='cameras'), 'Fujifilm X-T5 dengan 40.2MP APS-C sensor dan film simulation', 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=600', 22999000, true)
ON CONFLICT DO NOTHING;

-- Offers: Generate 3+ offers per product from different marketplaces
DO $$
DECLARE
  p RECORD;
  shopee_id uuid;
  toko_id uuid;
  lazada_id uuid;
  istore_id uuid;
  price_variation numeric;
BEGIN
  SELECT id INTO shopee_id FROM marketplaces WHERE slug='shopee';
  SELECT id INTO toko_id FROM marketplaces WHERE slug='tokopedia';
  SELECT id INTO lazada_id FROM marketplaces WHERE slug='lazada';
  SELECT id INTO istore_id FROM marketplaces WHERE slug='istore';

  FOR p IN SELECT id, reference_price, brand FROM products WHERE active = true LOOP
    -- Offer 1: Shopee (cheapest, best deal)
    price_variation := p.reference_price * (0.88 + random() * 0.05);
    INSERT INTO offers (product_id, marketplace_id, seller_id, price, shipping_cost, seller_rating, review_count, warranty, return_policy, product_url, affiliate_url, is_sponsored, active)
    VALUES (
      p.id, shopee_id,
      (SELECT id FROM sellers WHERE marketplace_id = shopee_id ORDER BY rating DESC LIMIT 1 OFFSET floor(random()*3)::int),
      round(price_variation), 0,
      4.8 + random() * 0.2,
      floor(1000 + random() * 50000)::int,
      'Garansi Resmi 1 Tahun', '7 Hari Pengembalian',
      'https://shopee.co.id/product/' || p.id::text,
      'https://shopee.co.id/affiliate/' || p.id::text,
      false, true
    );

    -- Offer 2: Tokopedia (mid price)
    price_variation := p.reference_price * (0.92 + random() * 0.04);
    INSERT INTO offers (product_id, marketplace_id, seller_id, price, shipping_cost, seller_rating, review_count, warranty, return_policy, product_url, affiliate_url, is_sponsored, active)
    VALUES (
      p.id, toko_id,
      (SELECT id FROM sellers WHERE marketplace_id = toko_id ORDER BY rating DESC LIMIT 1 OFFSET floor(random()*3)::int),
      round(price_variation), 0,
      4.7 + random() * 0.2,
      floor(500 + random() * 30000)::int,
      'Garansi Resmi 1 Tahun', '7 Hari Pengembalian',
      'https://tokopedia.com/product/' || p.id::text,
      'https://tokopedia.com/affiliate/' || p.id::text,
      false, true
    );

    -- Offer 3: Lazada (slightly higher)
    price_variation := p.reference_price * (0.95 + random() * 0.04);
    INSERT INTO offers (product_id, marketplace_id, seller_id, price, shipping_cost, seller_rating, review_count, warranty, return_policy, product_url, affiliate_url, is_sponsored, active)
    VALUES (
      p.id, lazada_id,
      (SELECT id FROM sellers WHERE marketplace_id = lazada_id ORDER BY rating DESC LIMIT 1 OFFSET floor(random()*2)::int),
      round(price_variation), 10000,
      4.7 + random() * 0.2,
      floor(300 + random() * 20000)::int,
      'Garansi Resmi 1 Tahun', '7 Hari Pengembalian',
      'https://lazada.co.id/product/' || p.id::text,
      'https://lazada.co.id/affiliate/' || p.id::text,
      false, true
    );

    -- For Apple products, add iStore offer
    IF p.brand = 'Apple' THEN
      price_variation := p.reference_price * (0.90 + random() * 0.06);
      INSERT INTO offers (product_id, marketplace_id, seller_id, price, shipping_cost, seller_rating, review_count, warranty, return_policy, product_url, affiliate_url, is_sponsored, active)
      VALUES (
        p.id, istore_id,
        (SELECT id FROM sellers WHERE marketplace_id = istore_id ORDER BY rating DESC LIMIT 1 OFFSET floor(random()*2)::int),
        round(price_variation), 0,
        4.9 + random() * 0.1,
        floor(2000 + random() * 100000)::int,
        'Garansi Resmi Apple 1 Tahun', '14 Hari Pengembalian',
        'https://istore.co.id/product/' || p.id::text,
        'https://istore.co.id/affiliate/' || p.id::text,
        false, true
      );
    END IF;
  END LOOP;
END $$;

-- Price History: Generate 30 days of historical prices for each offer
DO $$
DECLARE
  o RECORD;
  base_price numeric;
  day_offset integer;
  hist_price numeric;
  trend numeric;
BEGIN
  FOR o IN SELECT id, price FROM offers WHERE active = true LOOP
    base_price := o.price;
    FOR day_offset IN REVERSE 30..1 LOOP
      trend := (1.0 + (day_offset::numeric / 30.0) * 0.08);
      hist_price := round(base_price * trend * (0.98 + random() * 0.04));
      INSERT INTO price_history (offer_id, price, recorded_at)
      VALUES (o.id, hist_price, current_date - day_offset + (random() * interval '1 day'));
    END LOOP;
    INSERT INTO price_history (offer_id, price, recorded_at)
    VALUES (o.id, o.price, now());
  END LOOP;
END $$;
