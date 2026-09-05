-- Adds bilingual (English / Bangla) Blog Admin Panel support.
--
-- Apply with:
--   npx wrangler d1 execute taqwa-blog --remote --file=./migrations/0002_add_language.sql
-- (drop --remote for local dev against the emulated DB)
--
-- Purely additive and backward-safe: it only adds one column with a
-- DEFAULT, so every existing row (all 12 original posts, plus anything
-- created since) is automatically assigned language='en' and keeps
-- working exactly as before — nothing here deletes, drops, or rewrites
-- any existing table, row, or column.

ALTER TABLE posts ADD COLUMN language TEXT NOT NULL DEFAULT 'en';

CREATE INDEX IF NOT EXISTS idx_posts_language ON posts(language, status, publish_date DESC);
