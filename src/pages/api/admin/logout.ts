import type { APIRoute } from 'astro';
import { IS_CLOUDFLARE_BUILD } from '../../../lib/runtime-flag';
import { SESSION_COOKIE } from '../../../lib/auth';

export const prerender = !IS_CLOUDFLARE_BUILD;

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(SESSION_COOKIE, { path: '/' });
  return redirect('/admin/login');
};
