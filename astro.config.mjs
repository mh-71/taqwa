import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mh-71.github.io',
  // The site currently lives at mh-71.github.io/taqwa/ (a GitHub Pages
  // "project site"), not at a domain root. Without `base`, Astro generates
  // its CSS/JS asset links as root-absolute ("/_astro/..."), which resolve
  // to mh-71.github.io/_astro/... instead of .../taqwa/_astro/... and the
  // page loads with no styling at all. `base` prefixes those generated
  // links correctly.
  // NOTE: if a custom domain (e.g. taqwaautomobile.com) is ever pointed at
  // this site as its own root, change `site` to that domain and remove
  // `base` (set it back to '/').
  base: '/taqwa',
  // Output literal "about.html" style files (not /about/index.html) so every
  // existing internal link, external backlink and bookmarked URL keeps working
  // unchanged after the move to Astro.
  build: {
    format: 'file',
  },
});
