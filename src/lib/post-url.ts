// Blog post permalink helper. On the Cloudflare (SSR) deployment the detail
// route is served live at /blog/:slug. On the GitHub Pages / Vercel static
// builds the same page is prerendered, and this project's build.format:'file'
// setting (astro.config.mjs) names every prerendered route with a literal
// .html extension — so the link has to carry that suffix only on those
// builds. Every place that links to a post (Home's "Latest News", the Blog
// page's cards, sidebar "Recent Posts") goes through this one function.
import { IS_CLOUDFLARE_BUILD } from './runtime-flag';

export function postUrl(slug: string): string {
  return `blog/${slug}${IS_CLOUDFLARE_BUILD ? '' : '.html'}`;
}
