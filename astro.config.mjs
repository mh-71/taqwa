import { defineConfig } from 'astro/config';

// This project deploys to three places at once, and they don't all serve
// the site from the same place:
//   - GitHub Pages: mh-71.github.io/taqwa/     (a "project site" - subpath)
//   - Vercel:       taqwa-iota.vercel.app/     (its own domain root)
//   - Cloudflare:   taqwa.<account>.workers.dev/ (its own domain root)
// Vercel sets the VERCEL env var during its own builds; GitHub Actions
// (see .github/workflows/deploy.yml) does not. Cloudflare's dashboard build
// doesn't set an equivalent flag we can rely on, so its Build command is
// set explicitly to `CLOUDFLARE_WORKERS=1 npm run build` instead.
// NOTE: if a custom domain (e.g. taqwaautomobile.com) is later pointed at
// ANY of these deployments as its own root, that target's `site`/`base`
// below should be updated the same way the Vercel branch is (root, no base).
const isVercel = process.env.VERCEL === '1';
const isCloudflare = process.env.CLOUDFLARE_WORKERS === '1';
const isRootDeploy = isVercel || isCloudflare;

export default defineConfig({
  site: isVercel
    ? 'https://taqwa-iota.vercel.app'
    : isCloudflare
      ? 'https://taqwa.workers.dev'
      : 'https://mh-71.github.io',
  // Without `base`, Astro generates its CSS/JS asset links as root-absolute
  // ("/_astro/..."), which only resolves correctly when the site is served
  // from a domain root. GitHub Pages serves this project from the /taqwa/
  // subpath, so it needs that prefix; Vercel and Cloudflare serve it from
  // their own root, so they need none.
  // Trailing slash matters: import.meta.env.BASE_URL reflects this value
  // verbatim, and page code does `base + "img/..."` (no extra slash), so
  // a non-root base must end in "/" or asset URLs collapse into
  // "/taqwaimg/..." instead of "/taqwa/img/...".
  base: isRootDeploy ? '/' : '/taqwa/',
  // Output literal "about.html" style files (not /about/index.html) so every
  // existing internal link, external backlink and bookmarked URL keeps working
  // unchanged after the move to Astro.
  build: {
    format: 'file',
  },
});
