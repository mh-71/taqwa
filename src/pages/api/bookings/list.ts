import type { APIRoute } from 'astro';
import { getAllBookings } from '../../../lib/booking-db';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    if (!runtime) {
      return new Response('API is only available on the Cloudflare deployment.', { status: 501 });
    }

    const db = runtime.env.DB;
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || '';

    const bookings = await getAllBookings(db, {
      status: status || undefined
    });

    // Format bookings for dashboard consumption
    const formattedBookings = bookings.map(b => ({
      id: b.id,
      customer_name: b.name,
      customer_email: b.email,
      customer_phone: b.phone_number,
      vehicle_number: b.registration_no,
      vehicle_type: `${b.vehicle_make} ${b.vehicle_model}`,
      service_type: b.service_type,
      preferred_date: b.preferred_date,
      preferred_time: b.preferred_time,
      status: b.status,
      created_at: b.created_at
    }));

    return new Response(JSON.stringify({ bookings: formattedBookings }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch bookings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
