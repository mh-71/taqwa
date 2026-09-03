# Taqwa Automobile

The official website for **Taqwa Automobile**, showcasing vehicle maintenance, repair, hybrid-car services, LPG/CNG conversion, detailing, and contact information.

**Live site:** [mh-71.github.io/taqwa](https://mh-71.github.io/taqwa/)

## Highlights

- Responsive, mobile-friendly service website
- Dedicated pages for key automobile and hybrid services
- Gallery, blog, service details, contact information, and direct call/WhatsApp actions
- Shared Astro layout, header, footer, icon sprite, and global design system
- Static output suitable for GitHub Pages, Vercel, and Cloudflare Workers

## Technology

- [Astro](https://astro.build/) 4
- HTML, CSS, and minimal client-side JavaScript
- GitHub Actions for GitHub Pages deployment

## Getting started

### Prerequisites

- Node.js 20 or later
- npm

### Install and run locally

```bash
npm install
npm run dev
```

Open the local address displayed in the terminal, usually `http://localhost:4321`.

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the local development server. |
| `npm run build` | Generates the production website in `dist/`. |
| `npm run preview` | Serves the production build locally for review. |

## Project structure

```text
src/
  components/       Shared Header, Footer, and SVG icon sprite
  layouts/          Base page layout and SEO metadata
  pages/            Astro pages and service pages
  styles/           Global styles and responsive design rules
public/
  img/              Website images and visual assets
  favicon.png       Browser icon
.github/workflows/  GitHub Pages deployment workflow
```

## Deployment

### GitHub Pages

Every push to the `main` branch triggers the GitHub Actions workflow in `.github/workflows/deploy.yml`. It installs dependencies, builds the static site, and deploys the contents of `dist/` to GitHub Pages.

The GitHub Pages build uses the `/taqwa/` base path automatically.

### Vercel

Vercel builds are detected through its `VERCEL` environment variable and use the domain root as the base path.

### Cloudflare Workers

Cloudflare serves `dist/` as static assets. Configure the build command as:

```bash
CLOUDFLARE_WORKERS=1 npm run build
```

This ensures the site uses the domain root as its base path.

## Content and asset updates

- Add or replace visual assets in `public/img/`.
- Update page content in `src/pages/`.
- Update shared navigation, contact details, and social links in `src/components/Header.astro` and `src/components/Footer.astro`.
- Keep internal image URLs base-path-aware by using `import.meta.env.BASE_URL` where needed.

## Quality check before publishing

Run the following command before deploying:

```bash
npm run build
```

Review the generated pages locally with `npm run preview`, including navigation, mobile layout, forms, call links, WhatsApp links, and image loading.

## License

This project is private and intended for Taqwa Automobile.
