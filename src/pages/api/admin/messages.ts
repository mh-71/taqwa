import type { APIRoute } from 'astro';
import { verifySessionToken } from '../../../lib/auth';
import { listContactMessages } from '../../../lib/contact-db';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  // ===== AUTHENTICATION =====
  const runtime = (locals as any).runtime;
  if (!runtime) {
    return new Response('Admin API is only available on the Cloudflare deployment.', { status: 501 });
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

  // ===== GET MESSAGES WITH PAGINATION & FILTERING =====
  try {
    const db = runtime.env.DB;
    const url = new URL(request.url);

    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const status = url.searchParams.get('status') || '';
    const search = url.searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    const result = await listContactMessages(db, {
      status: status || undefined,
      search: search || undefined,
      limit,
      offset
    });

    return new Response(
      JSON.stringify({
        success: true,
        messages: result.messages,
        total: result.total,
        statusCounts: result.statusCounts,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(result.total / limit)
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch messages' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
