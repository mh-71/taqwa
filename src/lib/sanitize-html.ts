// ===== Minimal allowlist HTML sanitizer for post content =====
// The admin post editor is a plain contenteditable div (see ADMIN.md — kept
// deliberately dependency-free rather than pulling in a rich-text-editor
// package). This strips anything outside a small safe tag/attribute
// allowlist before content is stored, so a post body can't carry a <script>,
// an inline event handler, or a javascript: URL.
//
// This is a regex-based best-effort filter, not a full HTML parser (Cloudflare
// Workers has no DOMParser). It is appropriate for a single trusted admin
// account; if the admin panel is ever opened up to multiple/less-trusted
// editors, replace this with a real sanitizer library run through a proper
// parser instead.

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span',
  'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'img', 'blockquote',
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt'],
};

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  return /^(https?:\/\/|\/|#)/i.test(trimmed);
}

export function sanitizeHtml(input: string): string {
  if (!input) return '';

  // Drop entire script/style blocks (including their content) up front.
  let html = input.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');

  // Walk every tag; keep it only if allowed, stripping disallowed attributes.
  html = html.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, rawTag: string, rawAttrs: string) => {
    const tag = rawTag.toLowerCase();
    const isClosing = match.startsWith('</');

    if (!ALLOWED_TAGS.has(tag)) return '';
    if (isClosing) return `</${tag}>`;

    const allowed = ALLOWED_ATTRS[tag] ?? [];
    if (allowed.length === 0) return `<${tag}>`;

    const kept: string[] = [];
    const attrRe = /([a-zA-Z0-9-]+)\s*=\s*"([^"]*)"|([a-zA-Z0-9-]+)\s*=\s*'([^']*)'/g;
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrRe.exec(rawAttrs))) {
      const name = (attrMatch[1] ?? attrMatch[3]).toLowerCase();
      const value = attrMatch[2] ?? attrMatch[4] ?? '';
      if (!allowed.includes(name)) continue;
      if ((name === 'href' || name === 'src') && !isSafeUrl(value)) continue;
      if (name === 'target') {
        kept.push(`target="_blank"`, `rel="noopener noreferrer"`);
        continue;
      }
      const escaped = value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
      kept.push(`${name}="${escaped}"`);
    }
    return kept.length ? `<${tag} ${kept.join(' ')}>` : `<${tag}>`;
  });

  return html.trim();
}

/** Plain-text excerpt derived from sanitized HTML content, for search indexing / meta descriptions. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
