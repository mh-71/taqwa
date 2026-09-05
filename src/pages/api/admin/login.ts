import type { APIRoute } from 'astro';
import { IS_CLOUDFLARE_BUILD } from '../../../lib/runtime-flag';
import { SESSION_COOKIE, constantTimeEqual, createSessionToken } from '../../../lib/auth';

export const prerender = !IS_CLOUDFLARE_BUILD;

export const POST: APIRoute = async ({ request, cookies, redirect, locals }) => {
  const runtime = (locals as any).runtime;
  if (!runtime) {
    return new Response('Admin panel is only available on the Cloudflare deployment.', { status: 501 });
  }

  const form = await request.formData();
  const password = String(form.get('password') ?? '');
  const adminPassword: string | undefined = runtime.env.ADMIN_PASSWORD;
  const sessionSecret: string | undefined = runtime.env.ADMIN_SESSION_SECRET;

  if (!adminPassword || !sessionSecret) {
    return new Response(
      'Admin login is not configured yet. Set the ADMIN_PASSWORD and ADMIN_SESSION_SECRET secrets (see ADMIN.md).',
      { status: 500 }
    );
  }

  if (!password || !constantTimeEqual(password, adminPassword)) {
    return redirect('/admin/login?error=1');
  }

  const token = await createSessionToken(sessionSecret);
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return redirect('/admin');
};
