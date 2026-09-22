import type { APIRoute } from 'astro';
import { updateBookingStatus } from '../../../../../lib/booking-db';
import { verifySessionToken } from '../../../../../lib/auth';

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
    const newStatus = body.status;

    if (!bookingId || !['pending', 'confirmed', 'completed', 'cancelled'].includes(newStatus)) {
      return new Response(JSON.stringify({ error: 'Invalid booking ID or status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = runtime.env.DB;
    const success = await updateBookingStatus(db, bookingId, newStatus);

    if (success) {
      return new Response(JSON.stringify({ success: true, message: 'Status updated' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error updating booking status:', error);
    return new Response(JSON.stringify({ error: 'Failed to update booking' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
