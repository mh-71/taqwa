-- Taqwa Automobile Booking System — D1 schema + initial setup
--
-- Apply with:
--   npx wrangler d1 execute taqwa-blog --remote --file=./migrations/0006_add_bookings.sql
-- (or use --local for local development)
--
-- This creates the bookings table for the booking request system.
-- Visitors can submit booking requests which are stored here and managed by admins.

CREATE TABLE IF NOT EXISTS bookings (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  phone_number    TEXT NOT NULL,
  email           TEXT,
  vehicle_make    TEXT NOT NULL,
  vehicle_model   TEXT NOT NULL,
  registration_no TEXT,
  service_type    TEXT NOT NULL,
  preferred_date  TEXT NOT NULL,
  preferred_time  TEXT NOT NULL,
  message         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_status
ON bookings(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_date
ON bookings(preferred_date);

CREATE INDEX IF NOT EXISTS idx_bookings_phone
ON bookings(phone_number);
