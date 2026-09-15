-- Testimonial Dynamic Customer Review System — D1 schema + initial data
--
-- Apply with:
--   npx wrangler d1 execute taqwa-blog --remote --file=./migrations/0005_add_testimonials.sql
-- (or use --local for local development)
--
-- This creates the testimonials table for the new customer review system,
-- and seeds the 3 existing hardcoded testimonials from src/pages/index.astro
-- so they appear dynamically from the database with no data loss.

CREATE TABLE IF NOT EXISTS testimonials (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  location      TEXT,
  rating        INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_testimonials_status
ON testimonials(status, created_at DESC);

-- ===== SEED EXISTING 3 TESTIMONIALS AS APPROVED =====
-- These were hardcoded in src/pages/index.astro lines 989-1089
-- before the dynamic review system. Preserving them exactly,
-- with 'approved' status so they appear immediately on the public site.
-- Using WHERE NOT EXISTS to prevent duplicates if migration runs multiple times.

INSERT INTO testimonials (name, location, rating, review, status, created_at)
SELECT 'Rafiqul Haque', 'Uttara, Dhaka', 5,
  'Got my car converted to CNG here. The technicians explained every step and the price was fair. Six months on, everything still runs perfectly.',
  'approved', datetime('2026-08-15')
WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE name = 'Rafiqul Haque' AND review LIKE '%Six months on%');

INSERT INTO testimonials (name, location, rating, review, status, created_at)
SELECT 'Shirin Akter', 'Mirpur, Dhaka', 5,
  'Very honest workshop. They diagnosed an engine issue two other garages missed, fixed it same day, and the 2-year warranty gives real peace of mind.',
  'approved', datetime('2026-08-20')
WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE name = 'Shirin Akter' AND review LIKE '%diagnosed an engine issue%');

INSERT INTO testimonials (name, location, rating, review, status, created_at)
SELECT 'Mahmud Hasan', 'Dhanmondi, Dhaka', 5,
  'Excellent service and very professional technicians. They explained the problem clearly, completed the work on time, and the car is running smoothly again.',
  'approved', datetime('2026-08-25')
WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE name = 'Mahmud Hasan' AND review LIKE '%completed the work on time%');
