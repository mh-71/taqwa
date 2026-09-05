/// <reference path="../.astro/types.d.ts" />

// Minimal ambient declaration so astro.config.mjs / src/lib/runtime-flag.ts's
// `process.env.CLOUDFLARE_WORKERS` check type-checks without adding
// @types/node as a whole new dependency (this project only ever reads two
// env vars at build time, never anything else from `process`).
declare const process: { env: Record<string, string | undefined> };

// Blog Admin Panel: shape of the Cloudflare runtime @astrojs/cloudflare
// injects into Astro.locals on every request when this project is built
// with CLOUDFLARE_WORKERS=1 (see astro.config.mjs). On the GitHub Pages /
// Vercel static builds `locals.runtime` is simply undefined — every admin
// page and /api/admin/* route checks for that before touching it.
type AdminEnv = {
  DB: import('./lib/blog-db').D1Database;
  ADMIN_PASSWORD: string;
  ADMIN_SESSION_SECRET: string;
};

declare namespace App {
  interface Locals {
    runtime?: {
      env: AdminEnv;
      cf?: unknown;
      ctx?: { waitUntil(promise: Promise<unknown>): void };
    };
  }
}
