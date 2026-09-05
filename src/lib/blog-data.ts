// ===== Public blog data accessor =====
// Every public page (blog listing, category filter, search, detail page,
// sidebar recent posts, Home "Our Latest News") calls through THIS module,
// never blog-db.ts directly and never the snapshot JSON directly — so there
// is exactly one place that decides "where does blog content come from."
//
// - On the Cloudflare deployment (locals.runtime present): reads live from
//   D1 via blog-db.ts. A post published in /admin appears here immediately.
// - On GitHub Pages / Vercel (static build, no D1 binding reachable at
//   build time): falls back to the checked-in snapshot in blog-snapshot.json,
//   which is a point-in-time mirror of D1. See ADMIN.md for how to refresh it.
import * as db from './blog-db';
import type { D1Database, PostStatus } from './blog-db';
import snapshotData from './blog-snapshot.json';

export interface PublicPost {
  id: number | null;
  title: string;
  slug: string;
  categoryName: string;
  categorySlug: string;
  featuredImage: string;
  excerpt: string;
  content: string;
  author: string;
  tags: string[];
  publishDate: string;
  seoTitle: string;
  seoDescription: string;
}

export interface PublicCategory {
  name: string;
  slug: string;
  count: number;
}

function fromD1(p: db.Post): PublicPost {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    categoryName: p.category_name,
    categorySlug: p.category_slug,
    featuredImage: p.featured_image,
    excerpt: p.excerpt,
    content: p.content,
    author: p.author,
    tags: p.tags ? p.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    publishDate: p.publish_date,
    seoTitle: p.seo_title,
    seoDescription: p.seo_description,
  };
}

interface SnapshotPost {
  title: string;
  slug: string;
  category_slug: string;
  featured_image: string;
  excerpt: string;
  content: string;
  author: string;
  tags: string[];
  status: PostStatus;
  publish_date: string;
  seo_title: string;
  seo_description: string;
}

function snapshotPublishedPosts(): PublicPost[] {
  const categories = new Map(snapshotData.categories.map((c) => [c.slug, c.name]));
  return (snapshotData.posts as SnapshotPost[])
    .filter((p) => p.status === 'published')
    .map((p) => ({
      id: null,
      title: p.title,
      slug: p.slug,
      categoryName: categories.get(p.category_slug) ?? p.category_slug,
      categorySlug: p.category_slug,
      featuredImage: p.featured_image,
      excerpt: p.excerpt,
      content: p.content,
      author: p.author,
      tags: p.tags ?? [],
      publishDate: p.publish_date,
      seoTitle: p.seo_title,
      seoDescription: p.seo_description,
    }))
    .sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1));
}

export async function getPublishedPosts(
  runtimeDb: D1Database | null,
  opts: { categorySlug?: string; search?: string; limit?: number } = {}
): Promise<PublicPost[]> {
  if (runtimeDb) {
    const posts = await db.getPublishedPosts(runtimeDb, opts);
    return posts.map(fromD1);
  }

  let posts = snapshotPublishedPosts();
  if (opts.categorySlug) posts = posts.filter((p) => p.categorySlug === opts.categorySlug);
  if (opts.search) {
    const q = opts.search.toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
    );
  }
  if (opts.limit) posts = posts.slice(0, opts.limit);
  return posts;
}

export async function getLatestNews(runtimeDb: D1Database | null, limit = 3): Promise<PublicPost[]> {
  return getPublishedPosts(runtimeDb, { limit });
}

export async function getRecentPosts(runtimeDb: D1Database | null, limit = 4): Promise<PublicPost[]> {
  return getPublishedPosts(runtimeDb, { limit });
}

export async function getPostBySlug(runtimeDb: D1Database | null, slug: string): Promise<PublicPost | null> {
  if (runtimeDb) {
    const p = await db.getPostBySlug(runtimeDb, slug);
    return p ? fromD1(p) : null;
  }
  const posts = snapshotPublishedPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

/** "2026-08-15" -> "15 Aug 2026", matching the date style the site already used on Home's news cards. */
export function formatDisplayDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export async function getCategories(runtimeDb: D1Database | null): Promise<PublicCategory[]> {
  if (runtimeDb) {
    const cats = await db.getCategoriesWithCounts(runtimeDb);
    return cats.map((c) => ({ name: c.name, slug: c.slug, count: c.count }));
  }
  const posts = snapshotPublishedPosts();
  return snapshotData.categories.map((c) => ({
    name: c.name,
    slug: c.slug,
    count: posts.filter((p) => p.categorySlug === c.slug).length,
  }));
}
