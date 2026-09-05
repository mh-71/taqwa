// Single source of truth for "is this the Cloudflare (server) build or one of
// the static builds (GitHub Pages / Vercel)?" — read by astro.config.mjs to
// pick output/adapter, and by every admin page + /api/admin/* endpoint to set
// `export const prerender`. Evaluated once per build from the same env var,
// so both stay consistent within a single build invocation.
export const IS_CLOUDFLARE_BUILD = process.env.CLOUDFLARE_WORKERS === '1';
