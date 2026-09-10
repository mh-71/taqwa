-- Adds bilingual translation support to Blog Admin Panel.
--
-- Apply with:
--   npx wrangler d1 execute taqwa-blog --remote --file=./migrations/0003_blog_translations.sql
-- (drop --remote for local dev)
--
-- This migration:
-- 1. Adds original_language column to posts table
-- 2. Creates post_translations table for translated content
-- 3. Allows storing translations separately from original posts
-- 4. Maintains backward compatibility (all existing posts default to language='en')

ALTER TABLE posts ADD COLUMN original_language TEXT NOT NULL DEFAULT 'en';

CREATE TABLE IF NOT EXISTS post_translations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('en', 'bn')),
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(post_id, language)
);

CREATE INDEX IF NOT EXISTS idx_post_translations_post_id ON post_translations(post_id);
CREATE INDEX IF NOT EXISTS idx_post_translations_language ON post_translations(language);

DROP INDEX IF EXISTS idx_posts_language;
