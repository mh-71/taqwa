// ===== Automatic post translation (Claude API) =====
// Every blog post is offered in both English and Bangla. A post is written in
// one language in the admin panel; the other language is produced once, on the
// first request for it, and stored in the same `post_translations` table the
// admin panel writes to. Every later request reads that stored row, so a post
// is never translated twice and the admin can hand-edit the result afterwards.
//
// Deliberately dependency-free: one POST to the Messages API over `fetch`,
// which is all a Worker needs, and keeps this project on its single runtime
// dependency (@astrojs/cloudflare) as the rest of src/lib does.
//
// Requires the ANTHROPIC_API_KEY Worker secret (see ADMIN.md). Without it
// nothing here runs and the post simply stays in its original language - a
// missing key must never take the blog down.
import type { D1Database, PostLanguage } from './blog-db';
import { getPostTranslation, upsertPostTranslation } from './blog-db';
import type { PublicPost } from './blog-data';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-5';
const ANTHROPIC_VERSION = '2023-06-01';

const LANGUAGE_NAMES: Record<PostLanguage, string> = {
  en: 'English',
  bn: 'Bangla (Bengali)',
};

export function canTranslate(apiKey: string | undefined | null): apiKey is string {
  return typeof apiKey === 'string' && apiKey.trim().length > 0;
}

/** The language a post is NOT written in - the one the toggle offers. */
export function otherLanguage(language: PostLanguage): PostLanguage {
  return language === 'bn' ? 'en' : 'bn';
}

interface TranslatedFields {
  title: string;
  excerpt: string;
  content: string;
  seo_title: string;
  seo_description: string;
}

function systemPrompt(from: PostLanguage, to: PostLanguage): string {
  return [
    `You translate blog posts for Taqwa Automobile Service Center, a car workshop in Uttara, Dhaka.`,
    `They do LPG and CNG conversion, engine repair, hybrid vehicle service, car AC service, and detailing.`,
    ``,
    `Translate from ${LANGUAGE_NAMES[from]} to ${LANGUAGE_NAMES[to]}.`,
    ``,
    `Rules:`,
    `- Write the way a Dhaka car owner actually reads, not word-for-word. Keep the original's tone.`,
    `- Keep automotive terms the trade uses untranslated where a translation would confuse`,
    `  (LPG, CNG, ECU, AC, hybrid, inverter, radiator) - transliterate only when that reads more naturally.`,
    `- The "content" field is HTML. Reproduce every tag, attribute and nesting exactly as given,`,
    `  and translate only the text between tags. Never add, drop or reorder tags.`,
    `- Keep the brand name "Taqwa Automobile" as-is. Leave phone numbers, prices and dates unchanged.`,
    `- If a field is an empty string, return an empty string for it.`,
    ``,
    `Reply with a single JSON object and nothing else - no prose, no markdown fence:`,
    `{"title":"...","excerpt":"...","content":"...","seo_title":"...","seo_description":"..."}`,
  ].join('\n');
}

function parseJsonObject(raw: string): Record<string, unknown> {
  // Be forgiving about a stray markdown fence or leading prose: take the first
  // balanced-looking {...} span rather than trusting the whole string.
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('no JSON object in model reply');
  return JSON.parse(trimmed.slice(start, end + 1));
}

async function requestTranslation(
  apiKey: string,
  post: PublicPost,
  to: PostLanguage
): Promise<TranslatedFields> {
  const from = post.original_language;
  const payload = {
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    seo_title: post.seoTitle ?? '',
    seo_description: post.seoDescription ?? '',
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      // Translation is a mechanical task - low effort keeps it fast and cheap
      // without costing quality here.
      output_config: { effort: 'low' },
      system: systemPrompt(from, to),
      messages: [{ role: 'user', content: JSON.stringify(payload) }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    stop_reason?: string;
    content?: Array<{ type: string; text?: string }>;
  };
  if (data.stop_reason === 'refusal') throw new Error('Claude declined to translate this post');

  const text = (data.content ?? [])
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text as string)
    .join('');
  if (!text.trim()) throw new Error('empty reply from Claude');

  const obj = parseJsonObject(text);
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const fields: TranslatedFields = {
    title: str(obj.title).trim(),
    excerpt: str(obj.excerpt).trim(),
    content: str(obj.content).trim(),
    seo_title: str(obj.seo_title).trim(),
    seo_description: str(obj.seo_description).trim(),
  };

  // upsertPostTranslation refuses to insert a row without all three, and a post
  // missing its title or body is worse than showing the original.
  if (!fields.title || !fields.excerpt || !fields.content) {
    throw new Error('translation came back missing title, excerpt or content');
  }
  return fields;
}

/**
 * The translation of `post` into `to`: the stored one if there is one, otherwise
 * translated once now and stored. Returns null when there is no translation and
 * none can be made (no API key, or the call failed) - callers fall back to the
 * post's original language.
 */
export async function ensureTranslation(
  db: D1Database,
  apiKey: string | undefined | null,
  post: PublicPost,
  to: PostLanguage
): Promise<PublicPost | null> {
  if (!post.id) return null;

  const stored = await getPostTranslation(db, post.id, to);
  if (stored) return applyTranslation(post, stored);

  if (!canTranslate(apiKey)) return null;

  const fields = await requestTranslation(apiKey, post, to);
  await upsertPostTranslation(db, post.id, to, fields);
  return applyTranslation(post, fields);
}

/** The post as it reads in the translated language - only text changes. */
function applyTranslation(
  post: PublicPost,
  fields: { title: string; excerpt: string; content: string; seo_title?: string | null; seo_description?: string | null }
): PublicPost {
  return {
    ...post,
    title: fields.title,
    excerpt: fields.excerpt,
    content: fields.content,
    seoTitle: fields.seo_title || post.seoTitle,
    seoDescription: fields.seo_description || post.seoDescription,
  };
}
