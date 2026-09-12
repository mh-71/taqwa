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
import type { D1Database, PostStatus, PostLanguage, PostTranslation } from './blog-db';
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
  original_language: PostLanguage;
  publishDate: string;
  seoTitle: string;
  seoDescription: string;
  translations?: PostTranslation[];
}

export interface PublicCategory {
  name: string;
  slug: string;
  count: number;
}

function fromD1(p: db.Post, translations?: PostTranslation[]): PublicPost {
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
    original_language: p.original_language,
    publishDate: p.publish_date,
    seoTitle: p.seo_title,
    seoDescription: p.seo_description,
    translations: translations,
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
  original_language?: PostLanguage;
  publish_date: string;
  seo_title: string;
  seo_description: string;
  translations?: Array<{
    language: PostLanguage;
    title: string;
    excerpt: string;
    content: string;
    seo_title?: string;
    seo_description?: string;
  }>;
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
      original_language: p.original_language ?? 'en',
      publishDate: p.publish_date,
      seoTitle: p.seo_title,
      seoDescription: p.seo_description,
      translations: [],
    }))
    .sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1));
}

export async function getPublishedPosts(
  runtimeDb: D1Database | null,
  opts: { categorySlug?: string; search?: string; limit?: number } = {}
): Promise<PublicPost[]> {
  if (runtimeDb) {
    const posts = await db.getPublishedPosts(runtimeDb, opts);
    return posts.map((p) => fromD1(p));
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

export async function getLatestNews(
  runtimeDb: D1Database | null,
  limit = 3
): Promise<PublicPost[]> {
  return getPublishedPosts(runtimeDb, { limit });
}

export async function getRecentPosts(
  runtimeDb: D1Database | null,
  limit = 4
): Promise<PublicPost[]> {
  return getPublishedPosts(runtimeDb, { limit });
}

/** Looked up by slug alone (slugs are globally unique across both languages) -
 *  callers that must not mix languages check the returned post's `language`
 *  themselves (see src/pages/blog/[slug].astro and src/pages/bn/blog/[slug].astro). */
export async function getPostBySlug(runtimeDb: D1Database | null, slug: string): Promise<PublicPost | null> {
  if (runtimeDb) {
    const p = await db.getPostBySlug(runtimeDb, slug);
    return p ? fromD1(p) : null;
  }
  const posts = snapshotPublishedPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function getPostTranslation(
  runtimeDb: D1Database | null,
  postId: number,
  language: 'en' | 'bn'
): Promise<PublicPost | null> {
  // Try D1 first (Cloudflare deployment)
  if (runtimeDb) {
    const translation = await db.getPostTranslation(runtimeDb, postId, language);
    if (translation) {
      const originalPost = await db.getPostById(runtimeDb, postId);
      if (originalPost) {
        return {
          id: originalPost.id,
          title: translation.title,
          slug: originalPost.slug,
          categoryName: originalPost.category_name,
          categorySlug: originalPost.category_slug,
          featuredImage: originalPost.featured_image,
          excerpt: translation.excerpt,
          content: translation.content,
          author: originalPost.author,
          tags: originalPost.tags ? originalPost.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
          original_language: originalPost.original_language,
          publishDate: originalPost.publish_date,
          seoTitle: translation.seo_title || originalPost.seo_title,
          seoDescription: translation.seo_description || originalPost.seo_description,
          translations: [],
        };
      }
    }
  }

  // Fallback to snapshot for static builds (GitHub Pages, Vercel)
  const posts = snapshotPublishedPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;

  // Check if translation exists in snapshot
  if (post.translations && post.translations.length > 0) {
    const translation = post.translations.find((t) => t.language === language);
    if (translation) {
      return {
        id: postId,
        title: translation.title,
        slug: post.slug,
        categoryName: post.categoryName,
        categorySlug: post.categorySlug,
        featuredImage: post.featuredImage,
        excerpt: translation.excerpt,
        content: translation.content,
        author: post.author,
        tags: post.tags,
        original_language: post.original_language,
        publishDate: post.publishDate,
        seoTitle: translation.seo_title || post.seoTitle,
        seoDescription: translation.seo_description || post.seoDescription,
        translations: [],
      };
    }
  }

  return null;
}

// Bangla dates are spelled out rather than left to toLocaleDateString: the
// month names and digits are then the same everywhere regardless of which ICU
// data the runtime happens to ship, and there is no locale to get wrong.
const BN_MONTHS = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

function toBanglaDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/** "2026-08-15" -> "15 Aug 2026", or "১৫ আগস্ট ২০২৬" when read in Bangla.
 *  The English form matches the date style the site already used on Home's news cards. */
export function formatDisplayDate(isoDate: string, language: PostLanguage = 'en'): string {
  const d = new Date(isoDate + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return isoDate;
  if (language === 'bn') {
    return `${toBanglaDigits(d.getUTCDate())} ${BN_MONTHS[d.getUTCMonth()]} ${toBanglaDigits(d.getUTCFullYear())}`;
  }
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export async function getCategories(
  runtimeDb: D1Database | null
): Promise<PublicCategory[]> {
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
