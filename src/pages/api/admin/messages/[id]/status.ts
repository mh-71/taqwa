import type { APIRoute } from 'astro';
import { verifySessionToken } from '../../../../../lib/auth';
import { getContactMessageById, updateContactStatus, logAuditAction } from '../../../../../lib/contact-db';

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

    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const newStatus = body.status || '';
    const validStatuses = ['new', 'read', 'replied', 'spam'];

    if (!validStatuses.includes(newStatus)) {
      return new Response(JSON.stringify({ error: 'Invalid status value' }), {
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
      return new Response(JSON.stringify({ error: 'Cannot modify deleted message' }), {
        status: 410,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ===== UPDATE STATUS =====
    try {
      const result = await updateContactStatus(db, id, newStatus as 'new' | 'read' | 'replied' | 'spam');

      if (!result.success) {
        return new Response(JSON.stringify({ error: 'Failed to update status' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // ===== LOG AUDIT ACTION =====
      try {
        await logAuditAction(
          db,
          id,
          'status_changed',
          result.oldStatus || null,
          newStatus,
          null,
          null,
          JSON.stringify({ admin_action: 'manual_status_change' })
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
            previousStatus: result.oldStatus,
            newStatus
          }
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (dbError) {
      if (dbError instanceof Error && dbError.message.includes('Cannot modify deleted message')) {
        return new Response(JSON.stringify({ error: 'Cannot modify deleted message' }), {
          status: 410,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error updating message status:', error);
    return new Response(JSON.stringify({ error: 'Failed to update message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
