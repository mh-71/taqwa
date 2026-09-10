// ===== Admin auth guard =====
// Runs only for requests actually served by the Cloudflare Worker (SSR) —
// on the static GitHub Pages / Vercel builds there is no request pipeline at
// all, so this file simply never executes there; each admin/api page itself
// renders (or returns) a "Cloudflare only" notice when locals.runtime is
// absent (see ADMIN.md). This one guard protects every /admin page and every
// /api/admin/* endpoint except the login screen/endpoint themselves.
import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, verifySessionToken } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;

  // Handle old Bengali blog redirects (Cloudflare only)
  // /bn/blog -> /blog?lang=bn
  // /bn/blog/:slug -> /blog/:slug?lang=bn
  if (path === '/bn/blog' || path === '/bn/blog/') {
    return context.redirect('/blog?lang=bn', 301);
  }
  const bengliBlogMatch = path.match(/^\/bn\/blog\/([^/]+)$/);
  if (bengliBlogMatch) {
    const slug = bengliBlogMatch[1];
    return context.redirect(`/blog/${slug}?lang=bn`, 301);
  }

  const isLoginPage = path === '/admin/login';
  const isLoginApi = path === '/api/admin/login';
  const isAdminPage = path === '/admin' || path.startsWith('/admin/');
  const isAdminApi = path === '/api/admin' || path.startsWith('/api/admin/');

  const needsAuth = (isAdminPage && !isLoginPage) || (isAdminApi && !isLoginApi);
  if (!needsAuth) return next();

  const runtime = (context.locals as any).runtime;
  if (!runtime) return next(); // no Cloudflare binding => not the live deployment; page itself explains this

  const secret: string | undefined = runtime.env?.ADMIN_SESSION_SECRET;
  const token = context.cookies.get(SESSION_COOKIE)?.value;
  const valid = !!secret && (await verifySessionToken(secret, token));

  if (valid) return next();

  if (isAdminApi) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return context.redirect('/admin/login');
});
