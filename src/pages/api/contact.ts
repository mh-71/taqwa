import type { APIRoute } from 'astro';
import {
  validateContactMessage,
  normalizePhoneNumber,
  checkDuplicateSubmission,
  createContactMessage,
  updateEmailStatus,
  logAuditAction,
} from '../../lib/contact-db';

export const prerender = false;

const HONEYPOT_FIELDS = ['website', 'company'];

async function sendAdminNotification(email: string, message: string, resendApiKey?: string): Promise<{ success: boolean; error?: string }> {
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
        subject: `New Contact Message from ${email}`,
        html: `
          <h2>New Contact Message</h2>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Message:</strong></p>
          <blockquote>${escapeHtml(message)}</blockquote>
          <p><a href="https://taqwa.autos/admin/messages">View in Admin Panel</a></p>
        `,
        text: `New contact message from ${email}:\n\n${message}\n\nView in admin panel: https://taqwa.autos/admin/messages`,
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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // ===== CHECK REQUEST SIZE (before parsing) =====
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const bodySize = parseInt(contentLength, 10);
      if (bodySize > 10240) {
        return new Response(
          JSON.stringify({ error: 'Request body too large' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // ===== EXTRACT RUNTIME & DATABASE =====
    const runtime = (locals as any).runtime;
    if (!runtime) {
      return new Response(
        JSON.stringify({ error: 'Contact service not available' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = runtime.env.DB;
    const resendApiKey = runtime.env.RESEND_API_KEY;

    // ===== PARSE REQUEST BODY =====
    let formData: Record<string, any>;
    try {
      const body = await request.json();
      formData = body;
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ===== SPAM PROTECTION - HONEYPOT =====
    for (const field of HONEYPOT_FIELDS) {
      if (field in formData && (formData[field] !== undefined && formData[field] !== null && formData[field] !== '')) {
        // Silently reject bot submission
        return new Response(
          JSON.stringify({ error: 'Invalid submission' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // ===== VALIDATE INPUT =====
    let validatedData: { name: string; phoneNumber: string; email: string; serviceInterest: string; message: string };
    try {
      validatedData = validateContactMessage({
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        serviceInterest: formData.serviceInterest,
        message: formData.message,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      return new Response(
        JSON.stringify({ error: errorMessage, code: 'VALIDATION_ERROR' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ===== DUPLICATE DETECTION (24-HOUR WINDOW) =====
    const isDuplicate = await checkDuplicateSubmission(db, validatedData.phoneNumber);
    if (isDuplicate) {
      return new Response(
        JSON.stringify({
          error: 'Please wait before submitting another message',
          code: 'DUPLICATE_SUBMISSION_24H',
          retryAfterSeconds: 86400,
          message: 'You submitted a message less than 24 hours ago. Please wait or call us at +88-01854226757.',
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ===== SAVE TO DATABASE (FIRST) =====
    let messageId: number;
    try {
      messageId = await createContactMessage(db, {
        name: validatedData.name,
        phone_number: validatedData.phoneNumber,
        email: validatedData.email,
        service_interest: validatedData.serviceInterest,
        message: validatedData.message,
      });
    } catch (dbError) {
      console.error('Contact message database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save message. Please try again or call us.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ===== LOG CREATION AUDIT =====
    try {
      await logAuditAction(
        db,
        messageId,
        'created',
        null,
        null,
        null,
        null,
        JSON.stringify({ phone: validatedData.phoneNumber, email: validatedData.email })
      );
    } catch (auditError) {
      console.error('Audit log creation failed:', auditError);
      // Non-blocking: message already saved
    }

    // ===== TRY SEND EMAIL (NON-BLOCKING) =====
    let emailResult = { success: false, error: 'Email service not configured' };
    try {
      emailResult = await sendAdminNotification(validatedData.email, validatedData.message, resendApiKey);

      // Update email status in database
      if (emailResult.success) {
        try {
          await updateEmailStatus(db, messageId, 'sent');
          await logAuditAction(db, messageId, 'email_sent', null, 'success', null, null);
        } catch (updateError) {
          console.error('Email status update failed:', updateError);
        }
      } else {
        try {
          await updateEmailStatus(db, messageId, 'failed');
          await logAuditAction(db, messageId, 'email_failed', null, emailResult.error || 'unknown error', null, null);
        } catch (updateError) {
          console.error('Email failure status update failed:', updateError);
        }
      }
    } catch (emailError) {
      const errorMessage = emailError instanceof Error ? emailError.message : String(emailError);
      console.error('Email send exception:', errorMessage);
      // Non-blocking: message already saved
      try {
        await updateEmailStatus(db, messageId, 'failed');
        await logAuditAction(db, messageId, 'email_failed', null, errorMessage, null, null);
      } catch (updateError) {
        console.error('Email failure logging failed:', updateError);
      }
    }

    // ===== RETURN SUCCESS (regardless of email result) =====
    return new Response(
      JSON.stringify({
        success: true,
        messageId,
        message: 'Thank you! We\'ll get back to you soon.',
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Contact API error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
