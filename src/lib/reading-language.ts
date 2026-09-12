// ===== Which language the reader wants the blog in =====
// A language choice used to live only in the URL of the page it was made on, so
// it was lost the moment the reader opened another post: they translated one
// article, followed a link, and were back in English.
//
// The choice is now remembered for the visit, so every blog page follows it,
// and it still travels in ?lang= as well - that keeps a shared or bookmarked
// link explicit about which version it points at, and keeps the hreflang pair
// on the detail page honest.
import type { PostLanguage } from './blog-db';

export const LANG_COOKIE = 'taqwa_blog_lang';
const ONE_YEAR = 60 * 60 * 24 * 365;

/** Just the parts of the Astro global this needs - keeps it easy to reason about. */
interface RequestContext {
  url: URL;
  cookies: {
    get(name: string): { value: string } | undefined;
    set(name: string, value: string, options?: Record<string, unknown>): void;
  };
  locals: { runtime?: unknown };
}

function asLanguage(value: string | undefined | null): PostLanguage | null {
  return value === 'en' || value === 'bn' ? value : null;
}

/**
 * The language to render the blog in: an explicit `?lang=` wins, then whatever
 * the reader last switched to, then `fallback` (a post's own language on a
 * detail page, English on the listing).
 *
 * An explicit choice is remembered here, which is why this is called for its
 * effect as well as its value. Cookies only exist while a request is being
 * served, so on the prerendered builds this quietly reduces to reading the URL.
 */
export function readingLanguage(ctx: RequestContext, fallback: PostLanguage): PostLanguage {
  const explicit = asLanguage(ctx.url.searchParams.get('lang'));
  const live = !!ctx.locals.runtime;

  if (explicit) {
    if (live) {
      ctx.cookies.set(LANG_COOKIE, explicit, {
        path: '/',
        maxAge: ONE_YEAR,
        sameSite: 'lax',
      });
    }
    return explicit;
  }

  const remembered = live ? asLanguage(ctx.cookies.get(LANG_COOKIE)?.value) : null;
  return remembered ?? fallback;
}

/** Carries the reading language on a link, matching how ?lang= is written elsewhere. */
export function withLanguage(href: string, language: PostLanguage): string {
  if (language !== 'bn') return href;
  return `${href}${href.includes('?') ? '&' : '?'}lang=bn`;
}
