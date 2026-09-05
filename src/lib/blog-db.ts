// ===== Blog data layer (Cloudflare D1) =====
// Every admin page/API route AND every public page (blog, category, detail,
// home "Latest News", recent posts, search) reads through this one module —
// no query is duplicated in more than one place. See src/lib/blog-data.ts for
// the thin wrapper that also serves the static-snapshot fallback used by the
// GitHub Pages / Vercel builds, which have no D1 binding at all.
//
// Typed loosely (no @cloudflare/workers-types dependency) on purpose — this
// project intentionally stays down to a single new runtime dependency
// (@astrojs/cloudflare). `D1Database` here is a minimal structural type
// covering only the calls this file makes.

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
}
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(col?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<{ success: boolean; meta: { last_row_id: number; changes: number } }>;
}
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export type PostStatus = 'draft' | 'published';

export interface Post {
  id: number;
  title: string;
  slug: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  featured_image: string;
  excerpt: string;
  content: string;
  author: string;
  tags: string; // comma-separated in storage
  status: PostStatus;
  publish_date: string; // YYYY-MM-DD
  seo_title: string;
  seo_description: string;
  created_at: string;
  updated_at: string;
}

const POST_COLUMNS = `
  posts.id, posts.title, posts.slug, posts.category_id,
  categories.name AS category_name, categories.slug AS category_slug,
  posts.featured_image, posts.excerpt, posts.content, posts.author, posts.tags,
  posts.status, posts.publish_date, posts.seo_title, posts.seo_description,
  posts.created_at, posts.updated_at
`;
const POST_JOIN = `FROM posts JOIN categories ON categories.id = posts.category_id`;

// ---------- Public reads (published only) ----------

export async function getPublishedPosts(
  db: D1Database,
  opts: { categorySlug?: string; search?: string; limit?: number } = {}
): Promise<Post[]> {
  const clauses = [`posts.status = 'published'`];
  const params: unknown[] = [];

  if (opts.categorySlug) {
    clauses.push(`categories.slug = ?`);
    params.push(opts.categorySlug);
  }
  if (opts.search) {
    clauses.push(`(posts.title LIKE ? OR posts.excerpt LIKE ? OR posts.content LIKE ? OR categories.name LIKE ?)`);
    const term = `%${opts.search}%`;
    params.push(term, term, term, term);
  }

  let sql = `SELECT ${POST_COLUMNS} ${POST_JOIN} WHERE ${clauses.join(' AND ')} ORDER BY posts.publish_date DESC, posts.id DESC`;
  if (opts.limit) sql += ` LIMIT ${Number(opts.limit)}`;

  const { results } = await db.prepare(sql).bind(...params).all<Post>();
  return results;
}

export async function getPostBySlug(db: D1Database, slug: string): Promise<Post | null> {
  const sql = `SELECT ${POST_COLUMNS} ${POST_JOIN} WHERE posts.slug = ? AND posts.status = 'published' LIMIT 1`;
  return db.prepare(sql).bind(slug).first<Post>();
}

export async function getLatestNews(db: D1Database, limit = 3): Promise<Post[]> {
  return getPublishedPosts(db, { limit });
}

export async function getRecentPosts(db: D1Database, limit = 4): Promise<Post[]> {
  return getPublishedPosts(db, { limit });
}

export async function getCategoriesWithCounts(
  db: D1Database
): Promise<(Category & { count: number })[]> {
  const sql = `
    SELECT categories.id, categories.name, categories.slug,
           COUNT(posts.id) FILTER (WHERE posts.status = 'published') AS count
    FROM categories
    LEFT JOIN posts ON posts.category_id = categories.id
    GROUP BY categories.id
    ORDER BY categories.name ASC
  `;
  const { results } = await db.prepare(sql).all<Category & { count: number }>();
  return results;
}

// ---------- Admin reads (any status) ----------

export async function listAllPosts(
  db: D1Database,
  opts: { search?: string; categorySlug?: string; status?: PostStatus } = {}
): Promise<Post[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (opts.search) {
    clauses.push(`posts.title LIKE ?`);
    params.push(`%${opts.search}%`);
  }
  if (opts.categorySlug) {
    clauses.push(`categories.slug = ?`);
    params.push(opts.categorySlug);
  }
  if (opts.status) {
    clauses.push(`posts.status = ?`);
    params.push(opts.status);
  }

  let sql = `SELECT ${POST_COLUMNS} ${POST_JOIN}`;
  if (clauses.length) sql += ` WHERE ${clauses.join(' AND ')}`;
  sql += ` ORDER BY posts.updated_at DESC, posts.id DESC`;

  const { results } = await db.prepare(sql).bind(...params).all<Post>();
  return results;
}

export async function getPostById(db: D1Database, id: number): Promise<Post | null> {
  const sql = `SELECT ${POST_COLUMNS} ${POST_JOIN} WHERE posts.id = ? LIMIT 1`;
  return db.prepare(sql).bind(id).first<Post>();
}

export async function listCategories(db: D1Database): Promise<Category[]> {
  const { results } = await db.prepare(`SELECT id, name, slug FROM categories ORDER BY name ASC`).all<Category>();
  return results;
}

// ---------- Admin writes ----------

export interface PostInput {
  title: string;
  slug: string;
  categoryId: number;
  featuredImage: string;
  excerpt: string;
  content: string;
  author: string;
  tags: string;
  status: PostStatus;
  publishDate: string;
  seoTitle: string;
  seoDescription: string;
}

export async function createPost(db: D1Database, input: PostInput): Promise<number> {
  const sql = `
    INSERT INTO posts
      (title, slug, category_id, featured_image, excerpt, content, author, tags, status, publish_date, seo_title, seo_description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `;
  const res = await db
    .prepare(sql)
    .bind(
      input.title, input.slug, input.categoryId, input.featuredImage, input.excerpt,
      input.content, input.author, input.tags, input.status, input.publishDate,
      input.seoTitle, input.seoDescription
    )
    .run();
  return res.meta.last_row_id;
}

export async function updatePost(db: D1Database, id: number, input: PostInput): Promise<void> {
  const sql = `
    UPDATE posts SET
      title = ?, slug = ?, category_id = ?, featured_image = ?, excerpt = ?,
      content = ?, author = ?, tags = ?, status = ?, publish_date = ?,
      seo_title = ?, seo_description = ?, updated_at = datetime('now')
    WHERE id = ?
  `;
  await db
    .prepare(sql)
    .bind(
      input.title, input.slug, input.categoryId, input.featuredImage, input.excerpt,
      input.content, input.author, input.tags, input.status, input.publishDate,
      input.seoTitle, input.seoDescription, id
    )
    .run();
}

export async function setPostStatus(db: D1Database, id: number, status: PostStatus): Promise<void> {
  await db.prepare(`UPDATE posts SET status = ?, updated_at = datetime('now') WHERE id = ?`).bind(status, id).run();
}

export async function deletePost(db: D1Database, id: number): Promise<void> {
  await db.prepare(`DELETE FROM posts WHERE id = ?`).bind(id).run();
}

export async function slugExists(db: D1Database, slug: string, excludeId?: number): Promise<boolean> {
  const sql = excludeId
    ? `SELECT id FROM posts WHERE slug = ? AND id != ? LIMIT 1`
    : `SELECT id FROM posts WHERE slug = ? LIMIT 1`;
  const row = excludeId
    ? await db.prepare(sql).bind(slug, excludeId).first()
    : await db.prepare(sql).bind(slug).first();
  return !!row;
}

export async function createCategory(db: D1Database, name: string, slug: string): Promise<number> {
  const res = await db.prepare(`INSERT INTO categories (name, slug) VALUES (?, ?)`).bind(name, slug).run();
  return res.meta.last_row_id;
}

export async function updateCategory(db: D1Database, id: number, name: string, slug: string): Promise<void> {
  await db.prepare(`UPDATE categories SET name = ?, slug = ? WHERE id = ?`).bind(name, slug, id).run();
}

export async function deleteCategory(db: D1Database, id: number): Promise<{ ok: boolean; reason?: string }> {
  const inUse = await db.prepare(`SELECT COUNT(*) AS c FROM posts WHERE category_id = ?`).bind(id).first<{ c: number }>();
  if (inUse && inUse.c > 0) {
    return { ok: false, reason: `${inUse.c} post(s) still use this category — reassign them first.` };
  }
  await db.prepare(`DELETE FROM categories WHERE id = ?`).bind(id).run();
  return { ok: true };
}
