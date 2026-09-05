# Taqwa Blog Admin Panel — Setup & Reference

This is the one new piece of infrastructure added to the site: a password-protected
`/admin` panel for creating, editing, publishing and deleting blog posts and
categories, backed by a Cloudflare D1 database. **It only runs on the Cloudflare
Workers deployment** — see "Why only Cloudflare?" below.

Nothing about the public site's design, routes, or the other two deployments
(GitHub Pages, Vercel) changed except that they now read blog content from data
instead of hard-coded HTML (see "How the public pages get their data" below).

---

## 1. One-time setup

### 1.1 Install the new dependency and regenerate the lockfile

This project added exactly one new runtime dependency: `@astrojs/cloudflare`
(plus `wrangler` as a dev tool). **This sandbox had no npm registry access, so
this could not be installed or tested here** — you must do this yourself,
from a machine with normal internet access, before anything below will work:

```bash
npm install
```

This will update `package-lock.json`. **Commit the updated lockfile** — until
you do, GitHub Actions' and Vercel's `npm ci` step will fail immediately,
because the lockfile won't match the new `package.json`.

### 1.2 Create the D1 database

```bash
npx wrangler login
npx wrangler d1 create taqwa-blog
```

This prints a `database_id`. Copy it into `wrangler.jsonc`, replacing
`REPLACE_WITH_YOUR_D1_DATABASE_ID`.

### 1.3 Apply the schema + migrate existing posts

```bash
npm run db:migrate:remote
```

This runs `migrations/0001_init.sql` against the real (remote) D1 database —
it creates the `categories`/`posts` tables and inserts the 5 existing
categories and 12 existing blog posts exactly as they were hard-coded in
`src/pages/blog.astro` before this change (see that file's git history if you
want to compare). For local development against an emulated database instead,
use `npm run db:migrate:local`.

### 1.4 Set the two required secrets

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
```

- `ADMIN_PASSWORD` — whatever password you want to log into `/admin` with.
- `ADMIN_SESSION_SECRET` — any long random string (e.g. `openssl rand -hex 32`).
  Used only to sign the login session cookie; never shown to users.

Neither of these is ever written to source code — see `src/lib/auth.ts` and
`src/pages/api/admin/login.ts`.

### 1.5 Deploy

```bash
npm run cf:deploy
```

(`cf:build` builds with `CLOUDFLARE_WORKERS=1` so the adapter and admin routes
are actually included — see `astro.config.mjs`.)

Your other two deployments (GitHub Pages, Vercel) don't need any of the steps
above and keep deploying exactly as before — just make sure step 1.1's
lockfile update is committed, or their builds will fail on `npm ci`.

---

## 2. Using the admin panel

- URL: `https://<your-worker>.workers.dev/admin` (or your custom domain, once
  pointed at the Cloudflare deployment).
- Log in with the `ADMIN_PASSWORD` secret you set above.
- **Dashboard** (`/admin`): every post, with thumbnail, category, publish
  date, status, and Edit / Publish-Unpublish / Delete actions. Filter by
  title search, category, or status.
- **Add New Post** (`/admin/posts/new`): title, slug (auto-filled from the
  title, editable), category, featured image (picked from the existing
  `public/img/` files), short excerpt, full content (a plain
  contenteditable rich-text box — bold/italic/headings/lists/links, no
  external editor library), author, publish date, status (Draft/Published),
  tags, and optional SEO title/description.
- **Categories** (`/admin/categories`): add, rename, or delete a category
  (deleting is blocked while any post still uses it — reassign those posts
  first).
- A post only ever appears on the public site once its status is
  **Published**. Draft posts are invisible everywhere on the public site.

---

## 3. How the public pages get their data

Every public page reads through `src/lib/blog-data.ts`, which picks its data
source per deployment:

- **Cloudflare** (`Astro.locals.runtime` present): reads live from D1. A post
  published in `/admin` appears on the Blog page, its category, the sidebar,
  and Home's "Our Latest News" **immediately** — no rebuild needed.
- **GitHub Pages / Vercel** (static builds, no D1 binding reachable at build
  time): fall back to `src/lib/blog-snapshot.json`, a point-in-time mirror of
  D1 seeded from the same 12 original posts. **These two deployments do not
  automatically pick up new posts published in `/admin`.** To refresh them:
  export the current D1 data into that JSON file's shape (categories +
  posts) and commit it, then let those two platforms rebuild as usual. There
  is no automated sync job for this in the current setup — see "What's not
  done" below if you want one.

The new detail page (`src/pages/blog/[slug].astro`) didn't exist before this
change (every "Read More" link was previously inert). On Cloudflare it's
server-rendered per request from D1; on the static builds it's prerendered
for each known slug via `getStaticPaths`, reading the same snapshot file.

---

## 4. Why only Cloudflare?

GitHub Pages serves static files only — it cannot run a login check or touch
a database, ever. Vercel could run server code too, but doing so would mean
adding a *second* server adapter/config split; Cloudflare was chosen (per your
answer during setup) because it's already one of the three deploy targets, so
this project only ever grows one server adapter, not two.

---

## 5. Files added/changed (quick index)

**New:**
- `migrations/0001_init.sql` — D1 schema + migrated data
- `src/lib/blog-db.ts` — all D1 queries (single source of truth for SQL)
- `src/lib/blog-data.ts` — public-page data accessor (D1 or snapshot fallback)
- `src/lib/blog-snapshot.json` — static fallback data for GH Pages/Vercel
- `src/lib/auth.ts`, `src/lib/sanitize-html.ts`, `src/lib/slug.ts`,
  `src/lib/post-form.ts`, `src/lib/post-url.ts`, `src/lib/runtime-flag.ts`,
  `src/lib/available-images.ts`
- `src/middleware.ts` — admin auth guard
- `src/layouts/AdminLayout.astro`, `src/styles/admin.css`
- `src/components/admin/PostForm.astro`
- `src/pages/admin/**` — login, dashboard, new/edit post, categories
- `src/pages/api/admin/**` — login/logout/posts/categories endpoints
- `src/pages/blog/[slug].astro` — new public post detail page
- `ADMIN.md` (this file)

**Changed:**
- `astro.config.mjs` — conditional Cloudflare adapter/output (Cloudflare
  builds only)
- `wrangler.jsonc` — D1 binding, Worker entry point, nodejs_compat flag
- `package.json` — `@astrojs/cloudflare` + `wrangler` dev dependency, new
  `cf:*`/`db:*` scripts
- `src/env.d.ts` — `Astro.locals.runtime` typing
- `src/pages/index.astro` — "Our Latest News" now reads the 3 latest
  published posts instead of 6 hard-coded cards (markup/CSS unchanged)
- `src/pages/blog.astro` — cards, category sidebar, recent posts and search
  now read from data instead of hard-coded HTML (markup/CSS unchanged);
  "Read More" links now work

**Not touched:** Header, Footer, IconSprite, global.css, Layout.astro, or any
other page (about/contact/gallery/hybrid-services/car-ac-service/
car-wash-detailing/cng-conversion/engine-repair/lpg-conversion).

---

## 6. Known limitations / what's not done

- **GitHub Pages and Vercel don't auto-sync** with new/edited posts — see
  §3. If you want that automated, the next step would be a small script that
  pulls current D1 data via Cloudflare's D1 REST API and writes
  `blog-snapshot.json`, run in those platforms' build step — not built here
  since it needs a real Cloudflare API token to test against, which wasn't
  available in this environment.
- **No file upload** for featured images — the admin picks from the existing
  `public/img/` files (per the "don't overengineer" instruction). Adding a
  new photo still means adding it to `public/img/` and to
  `src/lib/available-images.ts` the normal way.
- **The rich-text editor** is a plain `contenteditable` div with a small
  toolbar (bold/italic/headings/lists/links) — no external editor library.
  Content is sanitized server-side (`src/lib/sanitize-html.ts`) with a
  regex-based allowlist, appropriate for a single trusted admin account.
- **Build not verified end-to-end in this environment** — see §7.

---

## 7. Verification status — please read before deploying

This sandbox had **no npm registry access at all** (not even to install the
`astro` package that was already a dependency before this change), so none of
the following could be run here and must be done by you:

- `npm install` (see §1.1)
- `npm run build` (static/GitHub Pages/Vercel path)
- `npm run cf:build` / `npm run cf:preview` (Cloudflare path, needs the
  adapter installed)
- Any actual login/create/edit/publish/delete flow against a real D1 database

What *was* verified in this environment: every new/changed file was read back
and manually checked for syntax correctness (a global TypeScript compiler was
used to type-check the plain `.ts` lib files individually), internal
consistency between the shared data-layer functions and every page/endpoint
that calls them, and that no hard-coded post/category data was left behind in
`index.astro` or `blog.astro`. Please run the commands above and do a full
click-through of §24 of the original spec (create/edit/draft/publish/
unpublish/delete/search/filter/detail page/Home Latest News/mobile+desktop)
before treating this as production-ready.
