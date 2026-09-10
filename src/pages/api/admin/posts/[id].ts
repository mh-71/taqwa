import type { APIRoute } from 'astro';
import { updatePost, deletePost, setPostStatus, slugExists, upsertPostTranslation } from '../../../../lib/blog-db';
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
  const { input, translation, errors } = parsePostForm(form);

  if (!errors.length && (await slugExists(db, input.slug, id))) {
    errors.push('That slug is already used by another post — choose a different one.');
  }
  if (errors.length) {
    return redirect(`/admin/posts/${id}/edit?error=${encodeURIComponent(errors.join(' '))}`);
  }

  await updatePost(db, id, input);

  // Update or add translation if provided
  if (translation && (translation.title || translation.excerpt || translation.content)) {
    try {
      await upsertPostTranslation(db, id, translation.language || (input.original_language === 'en' ? 'bn' : 'en'), translation);
    } catch (err) {
      console.error('Failed to update translation:', err);
      // Continue - post was updated successfully even if translation failed
    }
  }

  return redirect('/admin?updated=1');
};
