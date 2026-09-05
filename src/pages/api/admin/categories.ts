import type { APIRoute } from 'astro';
import { IS_CLOUDFLARE_BUILD } from '../../../lib/runtime-flag';
import { createCategory } from '../../../lib/blog-db';
import { slugify } from '../../../lib/slug';

export const prerender = !IS_CLOUDFLARE_BUILD;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const runtime = (locals as any).runtime;
  if (!runtime) return new Response('Admin API is only available on the Cloudflare deployment.', { status: 501 });
  const db = runtime.env.DB;

  const form = await request.formData();
  const name = String(form.get('name') ?? '').trim();
  if (!name) return redirect('/admin/categories?error=' + encodeURIComponent('Category name is required.'));

  await createCategory(db, name, slugify(name));
  return redirect('/admin/categories?created=1');
};
