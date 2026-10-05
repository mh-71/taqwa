import type { APIRoute } from 'astro';
import { verifySessionToken } from '../../../../../lib/auth';
import { getContactMessageById, updateEmailStatus, logAuditAction } from '../../../../../lib/contact-db';

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

async function sendAdminNotificationRetry(email: string, message: string, resendApiKey?: string): Promise<{ success: boolean; error?: string }> {
  if (!resendApiKey) {
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'admin@taqwa.autos',
        to: 'mosharrafhossen090@gmail.com',
        subject: `[RETRY] New Contact Message from ${email}`,
        html: `
          <h2>New Contact Message (Retry)</h2>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Message:</strong></p>
          <blockquote>${escapeHtml(message)}</blockquote>
          <p><a href="https://taqwa.autos/admin/messages">View in Admin Panel</a></p>
        `,
        text: `[RETRY] New contact message from ${email}:\n\n${message}\n\nView in admin panel: https://taqwa.autos/admin/messages`,
      }),
    });

    if (!response.ok) {
      await response.text();
      console.error(`Resend API error status: ${response.status}`);
      return { success: false, error: `Resend API error: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Email send failed: ${errorMessage}` };
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

    // ===== VERIFY MESSAGE EXISTS =====
    const message = await getContactMessageById(db, id);
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (message.deleted_at !== null) {
      return new Response(JSON.stringify({ error: 'Cannot send email for deleted message' }), {
        status: 410,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ===== SEND EMAIL RETRY =====
    try {
      const emailResult = await sendAdminNotificationRetry(message.email, message.message, resendApiKey);

      if (emailResult.success) {
        try {
          await updateEmailStatus(db, id, 'sent');
          await logAuditAction(db, id, 'email_retried', 'failed', 'sent', null, null, 'Admin triggered email retry');
        } catch (updateError) {
          console.error('Email status update failed:', updateError);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: {
              id,
              emailRetried: true,
              status: 'sent',
              attempts: message.email_attempts + 1,
              sentAt: new Date().toISOString()
            }
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      } else {
        try {
          await updateEmailStatus(db, id, 'failed');
          await logAuditAction(db, id, 'email_retried', 'failed', 'failed', null, null, `Admin retry failed: ${emailResult.error || 'unknown'}`);
        } catch (updateError) {
          console.error('Email failure logging failed:', updateError);
        }

        return new Response(
          JSON.stringify({
            success: false,
            error: 'Email send failed',
            details: emailResult.error || 'Unknown error',
            attempts: message.email_attempts + 1
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (emailError) {
      const errorMessage = emailError instanceof Error ? emailError.message : String(emailError);
      console.error('Email retry exception:', errorMessage);

      try {
        await updateEmailStatus(db, id, 'failed');
        await logAuditAction(db, id, 'email_retried', 'failed', 'failed', null, null, errorMessage);
      } catch (updateError) {
        console.error('Email failure logging failed:', updateError);
      }

      return new Response(
        JSON.stringify({ error: 'Email send exception', details: errorMessage }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error retrying email:', error);
    return new Response(JSON.stringify({ error: 'Failed to retry email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
