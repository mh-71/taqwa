#!/usr/bin/env node

/**
 * Sync D1 blog data to snapshot.json for static builds (GitHub Pages, Vercel)
 *
 * This script:
 * 1. Connects to Cloudflare D1 via wrangler
 * 2. Fetches all published posts with their Bengali translations
 * 3. Generates blog-snapshot.json with complete translation data
 *
 * Usage:
 *   node scripts/sync-d1-to-snapshot.mjs [--local] [--allow-fail]
 *
 * Options:
 *   --local       Use local emulated D1 (for development)
 *   --allow-fail  Don't exit on error (used in CI/CD, falls back to current snapshot)
 *   (default)     Use remote D1 (production database)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const snapshotPath = path.resolve(projectRoot, 'src/lib/blog-snapshot.json');

// Determine options
const useLocal = process.argv.includes('--local');
const allowFail = process.argv.includes('--allow-fail');
const dbFlag = useLocal ? '--local' : '--remote';
const isCI = process.env.GITHUB_ACTIONS === 'true' || process.env.VERCEL === '1';

console.log(`📚 Syncing D1 blog data to snapshot.json (${useLocal ? 'local' : 'remote'})...`);
if (isCI) console.log(`   Running in CI/CD environment (${process.env.GITHUB_ACTIONS ? 'GitHub Actions' : 'Vercel'})`);

/**
 * Execute a D1 query via wrangler and return the results
 */
function queryD1(sql) {
  try {
    // Write SQL to temp file to avoid quoting issues on Windows
    const tempFile = path.join(projectRoot, '.sync-query.sql');
    fs.writeFileSync(tempFile, sql, 'utf-8');

    try {
      // Use wrangler to execute SQL and get JSON output
      const command = `npx wrangler d1 execute taqwa-blog ${dbFlag} --file "${tempFile}" --json`;
      const output = execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });

      try {
        const parsed = JSON.parse(output);
        return parsed.result?.results || [];
      } catch (parseErr) {
        console.error('Failed to parse D1 output:', output);
        return [];
      }
    } finally {
      // Clean up temp file
      try {
        fs.unlinkSync(tempFile);
      } catch {}
    }
  } catch (err) {
    if (allowFail) {
      console.warn(`⚠️  D1 query failed (continuing with existing snapshot): ${err.message}`);
      return null;
    }
    console.error(`❌ D1 query failed: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Fetch all categories from D1
 */
function fetchCategories() {
  const sql = `SELECT id, name, slug FROM categories ORDER BY id ASC`;
  const rows = queryD1(sql);
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    slug: row.slug
  }));
}

/**
 * Fetch all published posts with their translations from D1
 */
function fetchPostsWithTranslations() {
  // Fetch posts with their category names
  const postsSql = `
    SELECT
      p.id,
      p.title,
      p.slug,
      p.category_id,
      c.name AS category_name,
      c.slug AS category_slug,
      p.featured_image,
      p.excerpt,
      p.content,
      p.author,
      p.tags,
      p.original_language,
      p.status,
      p.publish_date,
      p.seo_title,
      p.seo_description
    FROM posts p
    JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'published'
    ORDER BY p.publish_date DESC
  `;

  const posts = queryD1(postsSql);

  // Fetch translations for all posts
  const translationsSql = `
    SELECT
      post_id,
      language,
      title,
      excerpt,
      content,
      seo_title,
      seo_description
    FROM post_translations
    WHERE language = 'bn'
  `;

  const translations = queryD1(translationsSql);

  // Build translation map: { postId: { bn: {...} } }
  const translationMap = {};
  translations.forEach(t => {
    if (!translationMap[t.post_id]) {
      translationMap[t.post_id] = {};
    }
    translationMap[t.post_id][t.language] = {
      language: t.language,
      title: t.title,
      excerpt: t.excerpt,
      content: t.content,
      seo_title: t.seo_title,
      seo_description: t.seo_description
    };
  });

  // Transform posts to snapshot format with translations
  return posts.map(p => ({
    title: p.title,
    slug: p.slug,
    category_slug: p.category_slug,
    featured_image: p.featured_image,
    excerpt: p.excerpt,
    content: p.content,
    author: p.author,
    tags: p.tags ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    status: p.status,
    original_language: p.original_language || 'en',
    publish_date: p.publish_date,
    seo_title: p.seo_title,
    seo_description: p.seo_description,
    // Add translations if they exist
    ...(translationMap[p.id] && { translations: Object.values(translationMap[p.id]) })
  }));
}

/**
 * Generate snapshot.json with categories and posts
 */
function generateSnapshot(categories, posts) {
  return {
    _comment: 'Static fallback blog data for GitHub Pages and Vercel builds. Synced from Cloudflare D1 database. Regenerate by running: npm run sync-blog',
    categories: categories.map(c => ({ name: c.name, slug: c.slug })),
    posts: posts
  };
}

/**
 * Write snapshot to file
 */
function writeSnapshot(snapshot) {
  const json = JSON.stringify(snapshot, null, 2);
  fs.writeFileSync(snapshotPath, json + '\n');
  console.log(`✅ Snapshot updated: ${snapshotPath}`);
  console.log(`   - ${snapshot.categories.length} categories`);
  console.log(`   - ${snapshot.posts.length} posts`);

  // Count translations
  const postsWithTranslations = snapshot.posts.filter(p => p.translations && p.translations.length > 0).length;
  console.log(`   - ${postsWithTranslations} posts with Bengali translations`);
}

/**
 * Main sync function
 */
async function syncBlogData() {
  try {
    console.log('📥 Fetching categories...');
    const categories = fetchCategories();

    if (!categories || categories.length === 0) {
      throw new Error('No categories found in D1');
    }
    console.log(`   Found ${categories.length} categories`);

    console.log('📥 Fetching posts with translations...');
    const posts = fetchPostsWithTranslations();

    if (!posts || posts.length === 0) {
      throw new Error('No posts found in D1');
    }
    console.log(`   Found ${posts.length} published posts`);

    console.log('📝 Generating snapshot.json...');
    const snapshot = generateSnapshot(categories, posts);

    console.log('💾 Writing to file...');
    writeSnapshot(snapshot);

    console.log('\n✨ Sync complete! Blog data is now in sync across all deployments.');
    process.exit(0);

  } catch (err) {
    if (allowFail && isCI) {
      console.warn(`\n⚠️  Sync failed in CI/CD, using existing snapshot.json`);
      console.warn(`   Error: ${err.message}`);
      console.warn(`   Blog translations will work with current snapshot data.`);
      process.exit(0);  // Don't fail the build
    } else {
      console.error(`\n❌ Sync failed: ${err.message}`);
      process.exit(1);
    }
  }
}

// Run sync with CI/CD safety flag
if (isCI) {
  console.log('🔒 Running with CI/CD safety mode (will not fail build on sync error)\n');
  process.argv.push('--allow-fail');
}

syncBlogData();
