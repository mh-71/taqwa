import { defineConfig } from 'astro/config';

// This project deploys to two places at once, and they don't serve the
// site from the same place:
//   - GitHub Pages: mh-71.github.io/taqwa/  (a "project site" - subpath)
//   - Vercel:       taqwa-iota.vercel.app/  (its own domain root)
// Vercel sets the VERCEL env var during its own builds; GitHub Actions
// (see .github/workflows/deploy.yml) does not, so this is a reliable way
// to tell which target is currently building and use the right base path.
// NOTE: if a custom domain (e.g. taqwaautomobile.com) is later pointed at
// EITHER deployment as its own root, that target's `site`/`base` below
// should be updated the same way the Vercel branch is (root, no base).
const isVercel = process.env.VERCEL === '1';

export default defineConfig({
  site: isVercel ? 'https://taqwa-iota.vercel.app' : 'https://mh-71.github.io',
  // Without `base`, Astro generates its CSS/JS asset links as root-absolute
  // ("/_astro/..."), which only resolves correctly when the site is served
  // from a domain root. GitHub Pages serves this project from the /taqwa/
  // subpath, so it needs that prefix; Vercel serves it from its own root,
  // so it needs none.
  // Trailing slash matters: import.meta.env.BASE_URL reflects this value
  // verbatim, and page code does `base + "img/..."` (no extra slash), so
  // a non-root base must end in "/" or asset URLs collapse into
  // "/taqwaimg/..." instead of "/taqwa/img/...".
  base: isVercel ? '/' : '/taqwa/',
  // Output literal "about.html" style files (not /about/index.html) so every
  // existing internal link, external backlink and bookmarked URL keeps working
  // unchanged after the move to Astro.
  build: {
    format: 'file',
  },
});
