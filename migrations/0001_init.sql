-- Taqwa Blog Admin Panel — initial D1 schema + data migration.
--
-- Apply with:
--   npx wrangler d1 execute taqwa-blog --remote --file=./migrations/0001_init.sql
-- (drop --remote for local dev against the emulated DB)
--
-- This migrates the 12 blog posts and 5 categories that were previously
-- hard-coded directly into src/pages/blog.astro (see ADMIN.md for the full
-- migration notes). Nothing here changes any existing public page's design —
-- it only gives that same content a home it can be edited from.

CREATE TABLE IF NOT EXISTS categories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  category_id     INTEGER NOT NULL REFERENCES categories(id),
  featured_image  TEXT NOT NULL,
  excerpt         TEXT NOT NULL,
  content         TEXT NOT NULL DEFAULT '',
  author          TEXT NOT NULL DEFAULT 'Taqwa Automobile Team',
  tags            TEXT NOT NULL DEFAULT '',      -- comma-separated, simple on purpose
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  publish_date    TEXT NOT NULL,                  -- YYYY-MM-DD
  seo_title       TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_posts_status_date ON posts(status, publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);

-- ===== Categories (preserved exactly as they existed on the public site) =====
INSERT OR IGNORE INTO categories (name, slug) VALUES
  ('LPG & CNG', 'lpg-cng'),
  ('Maintenance', 'maintenance'),
  ('Hybrid Tips', 'hybrid-tips'),
  ('Car Care', 'car-care'),
  ('News', 'news');

-- ===== Existing 12 posts, migrated verbatim from src/pages/blog.astro =====
-- Note: the original site only ever had a title + excerpt for each post (no
-- full article body existed anywhere). `content` is seeded from the excerpt
-- as a single starting paragraph — edit it in the admin panel to expand it.
INSERT OR IGNORE INTO posts
  (title, slug, category_id, featured_image, excerpt, content, author, publish_date, status)
VALUES
  ('LPG vs CNG: Which Conversion Is Right for Your Car?',
   'lpg-vs-cng-which-conversion-is-right-for-your-car',
   (SELECT id FROM categories WHERE slug='lpg-cng'),
   'img/latest-1.jpg',
   'Both fuels can cut your running costs, but they suit different driving habits and vehicle types. Here''s how to decide which conversion makes sense for you.',
   'Both fuels can cut your running costs, but they suit different driving habits and vehicle types. Here''s how to decide which conversion makes sense for you.',
   'Taqwa Automobile Team', '2026-08-15', 'published'),

  ('5 Signs Your Car Needs an Oil Change Now',
   '5-signs-your-car-needs-an-oil-change-now',
   (SELECT id FROM categories WHERE slug='maintenance'),
   'img/latest-2.jpg',
   'Skipping an oil change can quietly wear down your engine. Watch for these five warning signs before real damage sets in.',
   'Skipping an oil change can quietly wear down your engine. Watch for these five warning signs before real damage sets in.',
   'Taqwa Automobile Team', '2026-08-08', 'published'),

  ('How to Extend the Life of Your Hybrid Battery',
   'how-to-extend-the-life-of-your-hybrid-battery',
   (SELECT id FROM categories WHERE slug='hybrid-tips'),
   'img/latest-3.jpg',
   'Hybrid batteries are built to last, but a few driving and charging habits can add years to their lifespan.',
   'Hybrid batteries are built to last, but a few driving and charging habits can add years to their lifespan.',
   'Taqwa Automobile Team', '2026-07-29', 'published'),

  ('Why Regular AC Service Matters Before Summer',
   'why-regular-ac-service-matters-before-summer',
   (SELECT id FROM categories WHERE slug='car-care'),
   'img/evn-1.jpg',
   'A weak or noisy AC usually signals a bigger issue underneath. Here''s what a proper AC service checks and why timing matters.',
   'A weak or noisy AC usually signals a bigger issue underneath. Here''s what a proper AC service checks and why timing matters.',
   'Taqwa Automobile Team', '2026-07-20', 'published'),

  ('Common Myths About Hybrid Cars Debunked',
   'common-myths-about-hybrid-cars-debunked',
   (SELECT id FROM categories WHERE slug='hybrid-tips'),
   'img/hybrid-car.jpg',
   'From "the battery always needs replacing early" to "hybrids can''t handle heavy traffic" — we separate fact from fiction.',
   'From "the battery always needs replacing early" to "hybrids can''t handle heavy traffic" — we separate fact from fiction.',
   'Taqwa Automobile Team', '2026-07-12', 'published'),

  ('The Right Way to Wash Your Car Without Damaging the Paint',
   'the-right-way-to-wash-your-car-without-damaging-the-paint',
   (SELECT id FROM categories WHERE slug='car-care'),
   'img/car-wash.jpg',
   'Wrong soap, wrong cloth, wrong technique — small mistakes at the wash bay can dull your paint over time. Here''s how to do it right.',
   'Wrong soap, wrong cloth, wrong technique — small mistakes at the wash bay can dull your paint over time. Here''s how to do it right.',
   'Taqwa Automobile Team', '2026-07-03', 'published'),

  ('Is LPG Conversion Safe for Older Vehicles?',
   'is-lpg-conversion-safe-for-older-vehicles',
   (SELECT id FROM categories WHERE slug='lpg-cng'),
   'img/lpg.jpg',
   'Age alone isn''t the deciding factor — engine condition and kit quality matter more. Here''s what we check before recommending conversion.',
   'Age alone isn''t the deciding factor — engine condition and kit quality matter more. Here''s what we check before recommending conversion.',
   'Taqwa Automobile Team', '2026-06-24', 'published'),

  ('Oil & Filter Change: How Often Is Too Often?',
   'oil-and-filter-change-how-often-is-too-often',
   (SELECT id FROM categories WHERE slug='maintenance'),
   'img/evn-2.jpg',
   'More frequent isn''t always better. We break down the right interval based on oil type, driving conditions and mileage.',
   'More frequent isn''t always better. We break down the right interval based on oil type, driving conditions and mileage.',
   'Taqwa Automobile Team', '2026-06-15', 'published'),

  ('Meet the Team Behind Taqwa Automobile''s Service Quality',
   'meet-the-team-behind-taqwa-automobiles-service-quality',
   (SELECT id FROM categories WHERE slug='news'),
   'img/Expert-Technicians.jpg',
   'A closer look at the technicians, advisors and specialists who keep every job at our workshop up to standard.',
   'A closer look at the technicians, advisors and specialists who keep every job at our workshop up to standard.',
   'Taqwa Automobile Team', '2026-06-05', 'published'),

  ('CNG vs Petrol: A Real Cost Comparison for Dhaka Drivers',
   'cng-vs-petrol-a-real-cost-comparison-for-dhaka-drivers',
   (SELECT id FROM categories WHERE slug='lpg-cng'),
   'img/lpg-and-cng.jpg',
   'We ran the numbers on a typical daily commute to see how long it actually takes for a CNG conversion to pay for itself.',
   'We ran the numbers on a typical daily commute to see how long it actually takes for a CNG conversion to pay for itself.',
   'Taqwa Automobile Team', '2026-05-27', 'published'),

  ('Brake Maintenance Checklist Every Driver Should Know',
   'brake-maintenance-checklist-every-driver-should-know',
   (SELECT id FROM categories WHERE slug='maintenance'),
   'img/latest-4.jpg',
   'Squealing, pulling, soft pedal feel — here''s what each warning sign usually means and when to get it checked.',
   'Squealing, pulling, soft pedal feel — here''s what each warning sign usually means and when to get it checked.',
   'Taqwa Automobile Team', '2026-05-18', 'published'),

  ('How Our 24/7 Roadside Assistance Works',
   'how-our-24-7-roadside-assistance-works',
   (SELECT id FROM categories WHERE slug='news'),
   'img/Emergency-Roadside-Assistance.jpg',
   'Breakdown, flat tire, dead battery — here''s exactly what happens from the moment you call us to the moment we arrive.',
   'Breakdown, flat tire, dead battery — here''s exactly what happens from the moment you call us to the moment we arrive.',
   'Taqwa Automobile Team', '2026-05-09', 'published');
