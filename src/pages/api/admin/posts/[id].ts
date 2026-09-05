import type { APIRoute } from 'astro';
import { updatePost, deletePost, setPostStatus, slugExists } from '../../../../lib/blog-db';
import { parsePostForm } from '../../../../lib/post-form';

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals, redirect, url }) => {
  const runtime = (locals as any).runtime;
  if (!runtime) return new Response('Admin API is only available on the Cloudflare deployment.', { status: 501 });
  const db = runtime.env.DB;
  const id = Number(params.id);
  const action = url.searchParams.get('_action') ?? 'update';

  if (!Number.isFinite(id)) return new Response('Invalid post id.', { status: 400 });

  if (action === 'delete') {
    await deletePost(db, id);
    return redirect('/admin?deleted=1');
  }
  if (action === 'publish') {
    await setPostStatus(db, id, 'published');
    return redirect('/admin?published=1');
  }
  if (action === 'unpublish') {
    await setPostStatus(db, id, 'draft');
    return redirect('/admin?unpublished=1');
  }

  // action === 'update'
  const form = await request.formData();
  const { input, errors } = parsePostForm(form);

  if (!errors.length && (await slugExists(db, input.slug, id))) {
    errors.push('That slug is already used by another post — choose a different one.');
  }
  if (errors.length) {
    return redirect(`/admin/posts/${id}/edit?error=${encodeURIComponent(errors.join(' '))}`);
  }

  await updatePost(db, id, input);
  return redirect('/admin?updated=1');
};
