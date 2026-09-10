import type { APIRoute } from 'astro';
import { createPost, slugExists, upsertPostTranslation } from '../../../lib/blog-db';
import { parsePostForm } from '../../../lib/post-form';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const runtime = (locals as any).runtime;
  if (!runtime) return new Response('Admin API is only available on the Cloudflare deployment.', { status: 501 });
  const db = runtime.env.DB;

  const form = await request.formData();
  const { input, translation, errors } = parsePostForm(form);

  if (!errors.length && (await slugExists(db, input.slug))) {
    input.slug = `${input.slug}-${Date.now().toString().slice(-5)}`;
  }

  if (errors.length) {
    return redirect(`/admin/posts/new?error=${encodeURIComponent(errors.join(' '))}`);
  }

  const id = await createPost(db, input);

  // Add translation if provided
  if (translation && (translation.title || translation.excerpt || translation.content)) {
    try {
      await upsertPostTranslation(db, id, translation.language || (input.original_language === 'en' ? 'bn' : 'en'), translation);
    } catch (err) {
      console.error('Failed to create translation:', err);
      // Continue - post was created successfully even if translation failed
    }
  }

  return redirect(`/admin?created=${id}`);
};
