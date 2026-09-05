#!/usr/bin/env node
// Wraps `astro build` for the GitHub Pages / Vercel static targets.
//
// Astro's build-time route scanner requires `export const prerender` to be
// a literal `true`/`false` in source - it errors ("cannot be statically
// analyzed") on any computed expression, even one that just reads an
// imported constant. But this project genuinely needs different prerender
// behavior for the same page/endpoint files depending on which deployment
// is being built:
//   - Cloudflare: prerender = false (real per-request SSR against D1, so a
//     published post shows up immediately - see astro.config.mjs)
//   - GitHub Pages / Vercel: prerender = true (no adapter, so these pages
//     must be generated once at build time instead)
//
// The literal committed in these files is `false` (the Cloudflare/live
// state, since that's this project's "primary" behavior). This script
// temporarily flips it to `true` in just the files that need it, runs
// `astro build`, then always flips it back - so the working tree returns
// to its committed state whether the build succeeds or fails.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const FILES = [
  'src/pages/index.astro',
  'src/pages/blog.astro',
  'src/pages/blog/[slug].astro',
  'src/pages/admin/login.astro',
  'src/pages/admin/index.astro',
  'src/pages/admin/posts/new.astro',
  'src/pages/admin/posts/[id]/edit.astro',
  'src/pages/admin/categories.astro',
  'src/pages/api/admin/login.ts',
  'src/pages/api/admin/logout.ts',
  'src/pages/api/admin/posts.ts',
  'src/pages/api/admin/posts/[id].ts',
  'src/pages/api/admin/categories.ts',
  'src/pages/api/admin/categories/[id].ts',
];

const FALSE_LINE = 'export const prerender = false;';
const TRUE_LINE = 'export const prerender = true;';

function setAll(from, to) {
  for (const file of FILES) {
    const contents = readFileSync(file, 'utf8');
    if (!contents.includes(from)) {
      throw new Error(
        `scripts/build-static.mjs: expected to find "${from}" in ${file} but didn't - refusing to continue, nothing was changed further.`
      );
    }
    writeFileSync(file, contents.replace(from, to));
  }
}

setAll(FALSE_LINE, TRUE_LINE);
try {
  execSync('astro build', { stdio: 'inherit' });
} finally {
  // Always restore, even if the build itself failed, so the working tree
  // never ends up with the flipped (true) values committed by mistake.
  setAll(TRUE_LINE, FALSE_LINE);
}
