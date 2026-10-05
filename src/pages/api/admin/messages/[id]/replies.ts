import type { APIRoute } from 'astro';
import { verifySessionToken } from '../../../../../lib/auth';
import { getContactMessageById, getReplyHistory } from '../../../../../lib/contact-db';

export const prerender = false;

// Prevent static build validation error on dynamic [id] segment
export async function getStaticPaths() {
  return [];
}

export const GET: APIRoute = async ({ request, locals, params }) => {
  // ===== AUTHENTICATION =====
  const runtime = (locals as any).runtime;
  if (!runtime) {
    return new Response(
      JSON.stringify({ error: 'Admin API is only available on the Cloudflare deployment.' }),
      { status: 501, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ===== VERIFY ADMIN SESSION =====
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionCookie = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('taqwa_admin_session='));

  if (!sessionCookie) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = sessionCookie.split('=')[1];
  const secret = runtime.env.ADMIN_SESSION_SECRET;
  const isValid = await verifySessionToken(secret, token);

  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // ===== GET REPLY HISTORY =====
  try {
    const db = runtime.env.DB;
    const id = parseInt(params.id || '', 10);

    if (!Number.isFinite(id) || id < 1) {
      return new Response(JSON.stringify({ error: 'Invalid message ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify message exists
    const message = await getContactMessageById(db, id);
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get reply history
    const replies = await getReplyHistory(db, id, 100);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: id,
        replies: replies,
        count: replies.length
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Reply history API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch reply history' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
