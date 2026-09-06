// Shared parser for the New Post / Edit Post form submissions — used by
// both /api/admin/posts.ts (create) and /api/admin/posts/[id].ts (update)
// so the two never validate/normalize a post differently.
import { slugify } from './slug';
import { sanitizeHtml } from './sanitize-html';
import type { PostInput, PostStatus, PostLanguage } from './blog-db';

export interface PostFormResult {
  input: PostInput;
  errors: string[];
}

export function parsePostForm(form: FormData): PostFormResult {
  const errors: string[] = [];

  const title = String(form.get('title') ?? '').trim();
  let slug = String(form.get('slug') ?? '').trim();
  const categoryId = Number(form.get('categoryId'));
  const featuredImage = String(form.get('featuredImage') ?? '').trim();
  const excerpt = String(form.get('excerpt') ?? '').trim();
  const contentRaw = String(form.get('content') ?? '');
  const author = String(form.get('author') ?? '').trim() || 'Taqwa Automobile Team';
  const tags = String(form.get('tags') ?? '').trim();
  const status: PostStatus = String(form.get('status') ?? 'draft') === 'published' ? 'published' : 'draft';
  const language: PostLanguage = String(form.get('language') ?? 'en') === 'bn' ? 'bn' : 'en';
  const publishDate = String(form.get('publishDate') ?? '').trim();
  const seoTitle = String(form.get('seoTitle') ?? '').trim();
  const seoDescription = String(form.get('seoDescription') ?? '').trim();

  if (!title) errors.push('Title is required.');
  if (!categoryId) errors.push('Category is required.');
  if (!featuredImage) errors.push('Featured image is required.');
  if (!excerpt) errors.push('Short excerpt is required.');
  if (!publishDate) errors.push('Publish date is required.');

  slug = slugify(slug || title);
  // slugify() only keeps a-z0-9 (see src/lib/slug.ts), so a title written
  // entirely in Bangla (or any non-Latin script) with no manual slug
  // produces an empty string here. Fall back to a short generated slug
  // instead of blocking the post - it's still unique (slugExists is checked
  // by the caller) and the admin can always edit it to something readable.
  if (!slug) slug = `post-${Date.now().toString(36)}`;

  const content = sanitizeHtml(contentRaw);

  return {
    errors,
    input: {
      title,
      slug,
      categoryId,
      featuredImage,
      excerpt,
      content,
      author,
      tags,
      status,
      language,
      publishDate,
      seoTitle,
      seoDescription,
    },
  };
}
