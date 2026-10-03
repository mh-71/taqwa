import type { APIRoute } from 'astro';
import { verifySessionToken } from '../../../../../lib/auth';
import { getContactMessageById, softDeleteContactMessage, logAuditAction } from '../../../../../lib/contact-db';

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

    // ===== VERIFY MESSAGE EXISTS =====
    const message = await getContactMessageById(db, id);
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (message.deleted_at !== null) {
      return new Response(JSON.stringify({ error: 'Message already deleted' }), {
        status: 410,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ===== SOFT DELETE MESSAGE =====
    try {
      const success = await softDeleteContactMessage(db, id);

      if (!success) {
        return new Response(JSON.stringify({ error: 'Failed to delete message' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // ===== LOG AUDIT ACTION =====
      try {
        await logAuditAction(
          db,
          id,
          'deleted',
          null,
          message.status,
          null,
          null,
          JSON.stringify({ admin_action: 'soft_delete', recovery_window: '30_days' })
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
            deleted: true,
            recoveryWindow: '30 days',
            note: 'Message can be restored within 30 days'
          }
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (dbError) {
      if (dbError instanceof Error && dbError.message.includes('already deleted')) {
        return new Response(JSON.stringify({ error: 'Message already deleted' }), {
          status: 410,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
