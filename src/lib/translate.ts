// ===== Automatic post translation (Workers AI) =====
// Every blog post is offered in both English and Bangla. A post is written in
// one language in the admin panel; the other language is produced once, on the
// first request for it, and stored in the same `post_translations` table the
// admin panel writes to. Every later request reads that stored row, so a post
// is never translated twice and the admin can hand-edit the result afterwards.
//
// Deliberately dependency-free: plain `fetch` / the Workers AI binding, which
// is all a Worker needs, and keeps this project on its single runtime
// dependency (@astrojs/cloudflare) as the rest of src/lib does.
//
// Primary backend:
//   1. Workers AI (the `AI` binding) - free, no key, no billing. Uses controlled
//      batching to translate HTML content efficiently with minimal API calls.
//   2. Claude (optional fallback when ANTHROPIC_API_KEY secret is set) - higher
//      quality but requires API key and billing.
// Neither configured means posts simply stay in the language they were written
// in. A missing backend or a failed call must never take the blog down.
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

/** What translate.ts needs out of the Worker env - both halves optional. */
export interface TranslateEnv {
  ANTHROPIC_API_KEY?: string;
  AI?: { run(model: string, inputs: Record<string, unknown>): Promise<unknown> };
}

function hasClaude(env: TranslateEnv | null | undefined): boolean {
  return typeof env?.ANTHROPIC_API_KEY === 'string' && env.ANTHROPIC_API_KEY.trim().length > 0;
}

/** Whether a translation could be produced for a post that has none stored. */
export function canTranslate(env: TranslateEnv | null | undefined): boolean {
  return hasClaude(env) || !!env?.AI;
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

// ---------- Workers AI backend (free, no key) ----------
// m2m100 translates plain text, so HTML has to be handled by us: split the body
// on tags, translate only what sits between them, and glue it back together.
// That keeps every tag, attribute and nesting byte-identical - the model never
// sees markup it could mangle.
const WORKERS_AI_MODEL = '@cf/meta/m2m100-1.2b';
const AI_LANG_NAMES: Record<PostLanguage, string> = { en: 'english', bn: 'bengali' };

async function aiTranslateText(
  ai: NonNullable<TranslateEnv['AI']>,
  text: string,
  from: PostLanguage,
  to: PostLanguage
): Promise<string> {
  if (!text.trim()) return text;
  const out = (await ai.run(WORKERS_AI_MODEL, {
    text,
    source_lang: AI_LANG_NAMES[from],
    target_lang: AI_LANG_NAMES[to],
  })) as { translated_text?: string } | string;
  const translated = typeof out === 'string' ? out : out?.translated_text;
  if (typeof translated !== 'string' || !translated.trim()) {
    throw new Error('Workers AI returned no translation');
  }
  return translated;
}

async function translateSegmentsIndividually(
  ai: NonNullable<TranslateEnv['AI']>,
  segments: string[],
  from: PostLanguage,
  to: PostLanguage
): Promise<string[]> {
  if (segments.length === 0) return [];

  const MAX_CONCURRENT = 5;
  const results: string[] = new Array(segments.length);

  for (let i = 0; i < segments.length; i += MAX_CONCURRENT) {
    const batch = segments.slice(i, Math.min(i + MAX_CONCURRENT, segments.length));
    const batchIndices = Array.from({ length: batch.length }, (_, j) => i + j);

    const translations = await Promise.all(
      batch.map((segment) => aiTranslateText(ai, segment, from, to))
    );

    batchIndices.forEach((idx, j) => {
      results[idx] = translations[j];
    });
  }

  return results;
}

async function aiTranslateHtml(
  ai: NonNullable<TranslateEnv['AI']>,
  html: string,
  from: PostLanguage,
  to: PostLanguage
): Promise<string> {
  // Split on tags: tags end up at odd indexes, text at even indexes.
  const parts = html.split(/(<[^>]+>)/);

  // Separate tags (preserve as-is) from text segments (need translation).
  const textIndexes: number[] = [];
  const textSegments: string[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    if (parts[i].trim()) {
      textIndexes.push(i);
      textSegments.push(parts[i]);
    }
  }

  if (textSegments.length === 0) {
    return html; // No text to translate
  }

  // Group segments into batches (~2000 chars each) to reduce API calls from 50+ to 3-5.
  const SEGMENT_DELIMITER = '[TAQWA_SEGMENT_BREAK]';
  const MAX_BATCH_SIZE = 2000;
  const batches: string[][] = [];
  let currentBatch: string[] = [];
  let currentSize = 0;

  for (const segment of textSegments) {
    // If adding this segment would exceed limit and we have a batch, start a new one.
    if (currentSize + segment.length > MAX_BATCH_SIZE && currentBatch.length > 0) {
      batches.push(currentBatch);
      currentBatch = [];
      currentSize = 0;
    }
    currentBatch.push(segment);
    currentSize += segment.length + SEGMENT_DELIMITER.length;
  }
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  // Translate each batch with delimiter, with fallback to individual translation.
  const translatedSegments: string[] = [];
  for (const batch of batches) {
    try {
      const batchText = batch.join(SEGMENT_DELIMITER);
      const translated = await aiTranslateText(ai, batchText, from, to);

      // Split translated batch back on delimiter and validate segment count.
      const translatedParts = translated.split(SEGMENT_DELIMITER);
      if (translatedParts.length !== batch.length) {
        throw new Error(
          `Segment count mismatch: expected ${batch.length} segments but got ${translatedParts.length}`
        );
      }

      translatedSegments.push(...translatedParts);
    } catch (batchErr) {
      console.warn(
        `Batch translation failed (${(batchErr as Error).message}), retrying segments individually...`
      );

      try {
        const individualResults = await translateSegmentsIndividually(
          ai,
          batch,
          from,
          to
        );
        translatedSegments.push(...individualResults);
      } catch (fallbackErr) {
        throw new Error(
          `Batch failed and individual fallback failed: ${(fallbackErr as Error).message}`
        );
      }
    }
  }

  // Reconstruct HTML: replace text segments with translations, keep tags unchanged.
  const result: string[] = [];
  let segmentIndex = 0;
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      // Odd index = tag, keep as-is
      result.push(parts[i]);
    } else {
      // Even index = text
      if (parts[i].trim()) {
        // Non-empty text: use translated segment
        result.push(translatedSegments[segmentIndex]);
        segmentIndex++;
      } else {
        // Empty or whitespace-only: preserve original
        result.push(parts[i]);
      }
    }
  }

  return result.join('');
}

async function translateWithWorkersAI(
  ai: NonNullable<TranslateEnv['AI']>,
  post: PublicPost,
  to: PostLanguage
): Promise<TranslatedFields> {
  const from = post.original_language;
  // Translate all fields in parallel (not sequentially) to reduce latency.
  const [title, excerpt, content] = await Promise.all([
    aiTranslateText(ai, post.title, from, to),
    aiTranslateText(ai, post.excerpt, from, to),
    aiTranslateHtml(ai, post.content, from, to),
  ]);
  return {
    title: title.trim(),
    excerpt: excerpt.trim(),
    content: content.trim(),
    // Left empty on purpose: the SEO fields fall back to the post's own when
    // blank, and a machine-translated meta description is worse than none.
    seo_title: '',
    seo_description: '',
  };
}

/**
 * The translation of `post` into `to`: the stored one if there is one, otherwise
 * translated once now and stored. Returns null when there is no translation and
 * none can be made (no provider available, or all calls failed) - callers fall
 * back to the post's original language.
 *
 * Translation provider priority:
 * 1. D1 cache (checked first, if hit returns immediately)
 * 2. Workers AI (primary free provider)
 * 3. Claude API (optional fallback if ANTHROPIC_API_KEY configured)
 * 4. Original language (no provider available)
 */
export async function ensureTranslation(
  db: D1Database,
  env: TranslateEnv | null | undefined,
  post: PublicPost,
  to: PostLanguage
): Promise<PublicPost | null> {
  if (!post.id) return null;

  const stored = await getPostTranslation(db, post.id, to);
  if (stored) return applyTranslation(post, stored);

  let fields: TranslatedFields | null = null;

  // Try Workers AI first (primary free provider)
  if (!fields && env?.AI) {
    try {
      fields = await translateWithWorkersAI(env.AI, post, to);
    } catch (err) {
      console.error('Workers AI translation error:', err instanceof Error ? err.message : 'unknown error');
    }
  }

  // Fall back to Claude API (optional, requires ANTHROPIC_API_KEY)
  if (!fields && hasClaude(env)) {
    try {
      fields = await requestTranslation(env!.ANTHROPIC_API_KEY as string, post, to);
    } catch (err) {
      console.error('Claude translation error:', err instanceof Error ? err.message : 'unknown error');
    }
  }

  // No provider available or all failed
  if (!fields) {
    return null;
  }

  if (!fields.title || !fields.excerpt || !fields.content) {
    throw new Error('translation came back missing title, excerpt or content');
  }

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
