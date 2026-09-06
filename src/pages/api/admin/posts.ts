import type { APIRoute } from 'astro';
import { createPost, slugExists } from '../../../lib/blog-db';
import { parsePostForm } from '../../../lib/post-form';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const runtime = (locals as any).runtime;
  if (!runtime) return new Response('Admin API is only available on the Cloudflare deployment.', { status: 501 });
  const db = runtime.env.DB;

  const form = await request.formData();
  const { input, errors } = parsePostForm(form);

  if (!errors.length && (await slugExists(db, input.slug))) {
    // Keep the create flow moving instead of bouncing the user back to a
    // near-empty form over a slug collision — append a short suffix.
    input.slug = `${input.slug}-${Date.now().toString().slice(-5)}`;
  }

  if (errors.length) {
    // Preserve `lang` on the bounce-back — without it the New Post page has
    // no way to know which language editor to re-show and falls back to the
    // language-choice screen, silently swallowing the error message instead
    // of displaying it.
    return redirect(`/admin/posts/new?lang=${input.language}&error=${encodeURIComponent(errors.join(' '))}`);
  }

  const id = await createPost(db, input);
  return redirect(`/admin?created=${id}`);
};
