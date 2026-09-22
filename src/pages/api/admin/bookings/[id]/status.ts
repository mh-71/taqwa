import type { APIRoute } from 'astro';
import { updateBookingStatus, getBookingById, getBookingStatus } from '../../../../../lib/booking-db';
import { verifySessionToken } from '../../../../../lib/auth';
import { sendNotifications, shouldNotify } from '../../../../../lib/notifications';

export const prerender = false;

export const POST: APIRoute = async ({ request, params, locals }) => {
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

  // ===== UPDATE STATUS =====
  try {
    const body = await request.json();
    const bookingId = parseInt(params.id || '0');
    const newStatus = body.status as string;

    if (!bookingId || !['pending', 'confirmed', 'completed', 'cancelled'].includes(newStatus)) {
      return new Response(JSON.stringify({ error: 'Invalid booking ID or status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = runtime.env.DB;

    // Get current status for email decision
    const oldStatus = await getBookingStatus(db, bookingId);

    if (!oldStatus) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the status in database
    const success = await updateBookingStatus(db, bookingId, newStatus as any);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to update status' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Determine if notifications should be sent
    const notificationType = shouldNotify(oldStatus, newStatus);

    // Send multi-channel notifications if needed (but don't fail if notifications fail)
    let notificationResponse = {
      success: true,
      bookingStatus: newStatus,
      notifications: {
        email: 'skipped' as const,
        sms: 'skipped' as const,
        whatsapp: 'skipped' as const
      }
    };

    if (notificationType) {
      try {
        const booking = await getBookingById(db, bookingId);

        if (booking) {
          // Send multi-channel notifications
          notificationResponse = await sendNotifications(booking, notificationType, runtime.env as any);
        }
      } catch (notificationError) {
        console.error(`Error sending notifications for booking ${bookingId}:`, notificationError);
        // Don't fail the API response due to notification errors
        // Booking status was already updated successfully
      }
    }

    // Return success with notification results
    // The booking status was updated successfully regardless of notification delivery
    return new Response(JSON.stringify({
      success: true,
      message: 'Status updated',
      bookingStatus: newStatus,
      notifications: notificationResponse.notifications,
      ...(notificationResponse.errors && { notificationErrors: notificationResponse.errors })
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return new Response(JSON.stringify({ error: 'Failed to update booking' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
