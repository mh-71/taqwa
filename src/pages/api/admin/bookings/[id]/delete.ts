import type { APIRoute } from 'astro';
import { deleteBooking } from '../../../../../lib/booking-db';
import { verifySessionToken } from '../../../../../lib/auth';

export const prerender = false;

export const DELETE: APIRoute = async ({ request, params, locals }) => {
  const runtime = (locals as any).runtime;
  if (!runtime) {
    return new Response('Admin API is only available on the Cloudflare deployment.', { status: 501 });
  }

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

  try {
    const bookingId = parseInt(params.id || '0');
    if (!bookingId) {
      return new Response(JSON.stringify({ error: 'Invalid booking ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = runtime.env.DB;
    const success = await deleteBooking(db, bookingId);

    if (success) {
      return new Response(JSON.stringify({ success: true, message: 'Booking deleted' }), {
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
    console.error('Error deleting booking:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete booking' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
