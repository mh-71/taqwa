// Blog post permalink helper. On the Cloudflare (SSR) deployment the detail
// route is served live at /blog/:slug. On the GitHub Pages / Vercel static
// builds the same page is prerendered, and this project's build.format:'file'
// setting (astro.config.mjs) names every prerendered route with a literal
// .html extension — so the link has to carry that suffix only on those
// builds. Every place that links to a post (Home's "Latest News", the Blog
// page's cards, sidebar "Recent Posts") goes through this one function.
//
// `language` defaults to 'en', so every existing call site (which never
// passed a second argument) keeps producing the exact same "blog/slug" URL
// it always did. Bangla posts live under their own "bn/blog/slug" path so
// the two languages' posts never collide or mix.
import { IS_CLOUDFLARE_BUILD } from './runtime-flag';
import type { PostLanguage } from './blog-db';

export function postUrl(slug: string, language: PostLanguage = 'en'): string {
  const prefix = language === 'bn' ? 'bn/blog/' : 'blog/';
  return `${prefix}${slug}${IS_CLOUDFLARE_BUILD ? '' : '.html'}`;
}
