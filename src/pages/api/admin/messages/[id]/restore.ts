import type { APIRoute } from 'astro';
import { verifySessionToken } from '../../../../../lib/auth';
import { getContactMessageById, restoreContactMessage, logAuditAction } from '../../../../../lib/contact-db';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, params }) => {
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

  // ===== PARSE & VALIDATE REQUEST =====
  try {
    const db = runtime.env.DB;
    const id = parseInt(params.id || '', 10);

    if (!Number.isFinite(id) || id < 1) {
      return new Response(JSON.stringify({ error: 'Invalid message ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ===== VERIFY MESSAGE EXISTS & IS DELETED =====
    const message = await getContactMessageById(db, id);
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (message.deleted_at === null) {
      return new Response(JSON.stringify({ error: 'Message is not deleted' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ===== RESTORE MESSAGE =====
    try {
      const success = await restoreContactMessage(db, id);

      if (!success) {
        return new Response(JSON.stringify({ error: 'Failed to restore message' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // ===== LOG AUDIT ACTION =====
      try {
        await logAuditAction(
          db,
          id,
          'restored',
          message.deleted_at || null,
          'restored',
          null,
          null,
          JSON.stringify({ admin_action: 'restore' })
        );
      } catch (auditError) {
        console.error('Audit log failed:', auditError);
      }

      // ===== RETURN SUCCESS =====
      return new Response(
        JSON.stringify({
          success: true,
          message: {
            id,
            restored: true,
            status: message.status,
            note: 'Message has been restored to active status'
          }
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (dbError) {
      if (dbError instanceof Error && dbError.message.includes('not deleted')) {
        return new Response(JSON.stringify({ error: 'Message is not deleted' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error restoring message:', error);
    return new Response(JSON.stringify({ error: 'Failed to restore message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
