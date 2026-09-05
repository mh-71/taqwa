import type { APIRoute } from 'astro';
import { IS_CLOUDFLARE_BUILD } from '../../../../lib/runtime-flag';
import { updateCategory, deleteCategory } from '../../../../lib/blog-db';
import { slugify } from '../../../../lib/slug';

export const prerender = !IS_CLOUDFLARE_BUILD;

export const POST: APIRoute = async ({ params, request, locals, redirect, url }) => {
  const runtime = (locals as any).runtime;
  if (!runtime) return new Response('Admin API is only available on the Cloudflare deployment.', { status: 501 });
  const db = runtime.env.DB;
  const id = Number(params.id);
  const action = url.searchParams.get('_action') ?? 'update';

  if (!Number.isFinite(id)) return new Response('Invalid category id.', { status: 400 });

  if (action === 'delete') {
    const res = await deleteCategory(db, id);
    if (!res.ok) return redirect('/admin/categories?error=' + encodeURIComponent(res.reason ?? 'Could not delete category.'));
    return redirect('/admin/categories?deleted=1');
  }

  const form = await request.formData();
  const name = String(form.get('name') ?? '').trim();
  if (!name) return redirect('/admin/categories?error=' + encodeURIComponent('Category name is required.'));

  await updateCategory(db, id, name, slugify(name));
  return redirect('/admin/categories?updated=1');
};
