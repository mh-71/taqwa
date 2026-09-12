// Shared parser for the New Post / Edit Post form submissions — used by
// both /api/admin/posts.ts (create) and /api/admin/posts/[id].ts (update)
// so the two never validate/normalize a post differently.
import { slugify } from './slug';
import { sanitizeHtml } from './sanitize-html';
import type { PostInput, PostStatus, PostLanguage, TranslationInput } from './blog-db';

export interface PostFormResult {
  input: PostInput;
  translation?: TranslationInput;
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
  const original_language: PostLanguage = String(form.get('original_language') ?? 'en') === 'bn' ? 'bn' : 'en';
  const publishDate = String(form.get('publishDate') ?? '').trim();
  const seoTitle = String(form.get('seoTitle') ?? '').trim();
  const seoDescription = String(form.get('seoDescription') ?? '').trim();

  if (!title) errors.push('Title is required.');
  if (!categoryId) errors.push('Category is required.');
  if (!featuredImage) errors.push('Featured image is required.');
  if (!excerpt) errors.push('Short excerpt is required.');
  if (!publishDate) errors.push('Publish date is required.');

  slug = slugify(slug || title);
  if (!slug) slug = `post-${Date.now().toString(36)}`;

  const content = sanitizeHtml(contentRaw);

  // Parse optional translation
  let translation: TranslationInput | undefined;
  const translationLanguage = String(form.get('translation_language') ?? '');
  if (translationLanguage === 'en' || translationLanguage === 'bn') {
    const translationTitle = String(form.get('translation_title') ?? '').trim();
    const translationExcerpt = String(form.get('translation_excerpt') ?? '').trim();
    const translationContentRaw = String(form.get('translation_content') ?? '');

    // Translating a post into the language it is already written in would
    // overwrite it with itself - catch it here rather than storing nonsense.
    if (translationLanguage === original_language) {
      errors.push(
        'The translation language must be different from the post\'s own language.'
      );
    }

    // Only create translation if at least title is provided
    if (translationTitle || translationExcerpt || translationContentRaw) {
      translation = {
        language: translationLanguage,
        title: translationTitle || undefined,
        excerpt: translationExcerpt || undefined,
        content: translationContentRaw ? sanitizeHtml(translationContentRaw) : undefined,
        seo_title: String(form.get('translation_seoTitle') ?? '').trim() || undefined,
        seo_description: String(form.get('translation_seoDescription') ?? '').trim() || undefined,
      };
    }
  }

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
      original_language,
      publishDate,
      seoTitle,
      seoDescription,
    },
    translation,
  };
}
