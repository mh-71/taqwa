import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://taqwaautomobile.com',
  // Output literal "about.html" style files (not /about/index.html) so every
  // existing internal link, external backlink and bookmarked URL keeps working
  // unchanged after the move to Astro.
  build: {
    format: 'file',
  },
});
