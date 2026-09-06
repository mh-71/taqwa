// Single source of truth for "is this the Cloudflare (server) build or one of
// the static builds (GitHub Pages / Vercel)?" — used by postUrl() (see
// post-url.ts) and by the blog detail pages' getStaticPaths().
//
// This used to read `process.env.CLOUDFLARE_WORKERS` directly, which is
// correct only for code that runs during `astro build` on the build
// machine (e.g. getStaticPaths on the static builds). blog.astro and
// index.astro are prerender:false on Cloudflare, so their code - including
// every postUrl() call in them - actually executes per-request *inside the
// deployed Worker*, which has no such env var (it isn't inherited from the
// machine that ran the build). That made IS_CLOUDFLARE_BUILD always read
// false there, so every "Read More" link got a wrong ".html" suffix live on
// Cloudflare, which then failed to match any post's real slug and 404'd
// back to the blog listing.
//
// `__IS_CLOUDFLARE__` (see astro.config.mjs's `vite.define`) is instead
// inlined as a literal at bundle time, so the same correct value ends up in
// the code regardless of whether that code later runs during the build or
// inside the Worker.
declare const __IS_CLOUDFLARE__: boolean;
export const IS_CLOUDFLARE_BUILD = __IS_CLOUDFLARE__;
