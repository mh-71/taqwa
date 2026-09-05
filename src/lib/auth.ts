// ===== Admin session helper (Web Crypto only, zero new dependency) =====
// A session token is `<expiryTimestamp>.<hmacSignature>` — signed with the
// ADMIN_SESSION_SECRET Cloudflare secret so it can't be forged, and carries
// its own expiry so no server-side session store is needed. Set as an
// HttpOnly, Secure, SameSite=Lax cookie by /api/admin/login.
export const SESSION_COOKIE = 'taqwa_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

const encoder = new TextEncoder();

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = '';
  new Uint8Array(bytes).forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Constant-time-ish comparison for the submitted login password vs. the ADMIN_PASSWORD secret. */
export function constantTimeEqual(a: string, b: string): boolean {
  const ab = encoder.encode(a);
  const bb = encoder.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

export async function createSessionToken(secret: string): Promise<string> {
  const expires = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = String(expires);
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return `${payload}.${toBase64Url(sig)}`;
}

export async function verifySessionToken(secret: string, token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const dot = token.lastIndexOf('.');
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expires = Number(payload);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  const key = await hmacKey(secret);
  const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return timingSafeEqualStr(sig, toBase64Url(expectedSig));
}
