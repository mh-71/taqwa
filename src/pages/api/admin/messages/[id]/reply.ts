import type { APIRoute } from 'astro';
import { verifySessionToken } from '../../../../../lib/auth';
import { getContactMessageById, logAuditAction, createReply, updateReplyStatus } from '../../../../../lib/contact-db';

export const prerender = false;

// Prevent static build validation error on dynamic [id] segment
export async function getStaticPaths() {
  return [];
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

function generateIdempotencyKey(messageId: number, subject: string, timestamp: number): string {
  const data = `${messageId}|${subject}|${timestamp}`;
  const hash = Array.from(data).reduce((acc, char) => {
    const code = char.charCodeAt(0);
    return ((acc << 5) - acc) + code | 0;
  }, 0);
  return `reply_${messageId}_${Math.abs(hash)}_${timestamp}`;
}

async function sendReplyEmail(
  customerEmail: string,
  subject: string,
  body: string,
  resendApiKey?: string,
  idempotencyKey?: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  if (!resendApiKey) {
    return { success: false, error: 'Email service not configured' };
  }

  try {
    // HTML escape the body for safe email rendering
    const escapedBody = escapeHtml(body);
    const htmlContent = `
      <p>${escapedBody.replace(/\n/g, '<br />')}</p>
      <hr />
      <p style="font-size: 12px; color: #666; margin-top: 20px;">
        This is a reply from Taqwa Automobile Service Center.
      </p>
    `;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    };

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from: 'Taqwa Automobile <admin@taqwa.autos>',
        to: customerEmail,
        subject: subject,
        html: htmlContent,
        text: body,
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`Resend API error status: ${response.status}`, responseText);
      return { success: false, error: `Email service error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, messageId: (data as any).id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Reply email send failed:', errorMessage);
    return { success: false, error: `Failed to send reply: ${errorMessage}` };
  }
}

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
    const resendApiKey = runtime.env.RESEND_API_KEY;
    const id = parseInt(params.id || '', 10);

    if (!Number.isFinite(id) || id < 1) {
      return new Response(JSON.stringify({ error: 'Invalid message ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    let requestBody: any;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { subject, body } = requestBody;

    // Validate subject
    if (!subject || typeof subject !== 'string') {
      return new Response(JSON.stringify({ error: 'Subject is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (subject.length < 2 || subject.length > 200) {
      return new Response(JSON.stringify({ error: 'Subject must be 2-200 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate body
    if (!body || typeof body !== 'string') {
      return new Response(JSON.stringify({ error: 'Reply body is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (body.length < 10 || body.length > 5000) {
      return new Response(JSON.stringify({ error: 'Reply body must be 10-5000 characters' }), {
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
      return new Response(JSON.stringify({ error: 'Cannot reply to deleted message' }), {
        status: 410,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (message.status === 'spam') {
      return new Response(JSON.stringify({ error: 'Cannot reply to spam messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!message.email) {
      return new Response(JSON.stringify({ error: 'Customer email not available' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ===== REPLY FLOW: Create Pending → Send Email → Update Status =====
    let replyId: number | null = null;

    try {
      // Step 1: Generate idempotency key and create pending reply
      const idempotencyKey = generateIdempotencyKey(id, subject, Date.now());

      try {
        replyId = await createReply(db, {
          contact_message_id: id,
          to_email: message.email,
          subject: subject,
          body: body,
          status: 'pending',
          idempotency_key: idempotencyKey
        });
        console.log(`[Reply] Created pending reply record ${replyId} for message ${id}`);
      } catch (createError) {
        const errorMessage = createError instanceof Error ? createError.message : String(createError);
        console.error('[Reply] Failed to create pending reply:', errorMessage);

        try {
          await logAuditAction(
            db,
            id,
            'email_sent',
            null,
            null,
            null,
            null,
            JSON.stringify({ type: 'admin_reply', success: false, error: `Failed to create reply record: ${errorMessage}` })
          );
        } catch (auditError) {
          console.error('Audit log failed:', auditError);
        }

        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to create reply record',
            details: errorMessage
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Step 2: Send email with idempotency key
      const emailResult = await sendReplyEmail(
        message.email,
        subject,
        body,
        resendApiKey,
        idempotencyKey
      );

      // Step 3: Update reply status based on email result
      if (emailResult.success) {
        // Email succeeded: update reply status to 'sent' with provider message ID
        try {
          await updateReplyStatus(db, replyId, 'sent', emailResult.messageId);
          console.log(`[Reply] Updated reply ${replyId} status to sent`);
        } catch (updateError) {
          const errorMessage = updateError instanceof Error ? updateError.message : String(updateError);
          console.error('[Reply] Failed to update reply status to sent:', errorMessage);
          // Log but continue - email was sent successfully
        }

        // Step 4: Update contact message status to 'replied' only if email succeeded
        try {
          await db
            .prepare(`
              UPDATE contact_messages
              SET status = 'replied', updated_at = datetime('now')
              WHERE id = ? AND deleted_at IS NULL
            `)
            .bind(id)
            .run();
          console.log(`[Reply] Updated message ${id} status to replied`);
        } catch (statusError) {
          const errorMessage = statusError instanceof Error ? statusError.message : String(statusError);
          console.error('[Reply] Failed to update contact message status:', errorMessage);
          // Log but continue - email was sent successfully
        }

        // Step 5: Audit log success
        try {
          await logAuditAction(
            db,
            id,
            'email_sent',
            null,
            'replied',
            null,
            null,
            JSON.stringify({
              type: 'admin_reply',
              subject: subject.substring(0, 100),
              messageId: emailResult.messageId,
              replyId: replyId
            })
          );
        } catch (auditError) {
          console.error('Audit log failed:', auditError);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: {
              id,
              replyId: replyId,
              replySent: true,
              status: 'replied',
              sentAt: new Date().toISOString()
            }
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      } else {
        // Email failed: update reply status to 'failed', do NOT update contact message status
        try {
          await updateReplyStatus(db, replyId, 'failed');
          console.log(`[Reply] Updated reply ${replyId} status to failed`);
        } catch (updateError) {
          const errorMessage = updateError instanceof Error ? updateError.message : String(updateError);
          console.error('[Reply] Failed to update reply status to failed:', errorMessage);
        }

        // Audit log failure
        try {
          await logAuditAction(
            db,
            id,
            'email_sent',
            null,
            null,
            null,
            null,
            JSON.stringify({
              type: 'admin_reply',
              success: false,
              error: emailResult.error,
              replyId: replyId
            })
          );
        } catch (auditError) {
          console.error('Audit log failed:', auditError);
        }

        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to send reply',
            details: emailResult.error || 'Unknown error',
            replyId: replyId
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (emailException) {
      const errorMessage = emailException instanceof Error ? emailException.message : String(emailException);
      console.error('[Reply] Email exception:', errorMessage);

      // Attempt to update reply status to failed if we have replyId
      if (replyId) {
        try {
          await updateReplyStatus(db, replyId, 'failed');
        } catch (updateError) {
          console.error('[Reply] Failed to update reply to failed state:', updateError);
        }
      }

      try {
        await logAuditAction(
          db,
          id,
          'email_sent',
          null,
          null,
          null,
          null,
          JSON.stringify({ type: 'admin_reply', error: errorMessage, replyId })
        );
      } catch (auditError) {
        console.error('Audit log failed:', auditError);
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email send failed',
          details: errorMessage,
          replyId: replyId
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Reply API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to send reply' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
