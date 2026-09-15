import type { APIRoute } from 'astro';
import { updateTestimonialStatus, deleteTestimonial, getTestimonialById } from '../../../../lib/testimonial-db';
import { verifySessionToken } from '../../../../lib/auth';

export const prerender = false;

async function verifyAdmin(request: Request, runtime: any): Promise<boolean> {
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionCookie = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('taqwa_admin_session='));

  if (!sessionCookie) return false;

  const token = sessionCookie.split('=')[1];
  const secret = runtime.env.ADMIN_SESSION_SECRET;
  return await verifySessionToken(secret, token);
}

export const PATCH: APIRoute = async ({ request, params, locals }) => {
  const runtime = (locals as any).runtime;
  if (!runtime) {
    return new Response('Admin API unavailable', { status: 501 });
  }

  const isAuthorized = await verifyAdmin(request, runtime);
  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const id = parseInt(String(params.id));
    const body = await request.json() as { status?: string };

    if (!['pending', 'approved', 'rejected'].includes(body.status || '')) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = runtime.env.DB;
    const success = await updateTestimonialStatus(
      db,
      id,
      body.status as 'pending' | 'approved' | 'rejected'
    );

    if (!success) {
      return new Response(JSON.stringify({ error: 'Testimonial not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updated = await getTestimonialById(db, id);
    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return new Response(JSON.stringify({ error: 'Failed to update testimonial' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request, params, locals }) => {
  const runtime = (locals as any).runtime;
  if (!runtime) {
    return new Response('Admin API unavailable', { status: 501 });
  }

  const isAuthorized = await verifyAdmin(request, runtime);
  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const id = parseInt(String(params.id));
    const db = runtime.env.DB;
    const success = await deleteTestimonial(db, id);

    if (!success) {
      return new Response(JSON.stringify({ error: 'Testimonial not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete testimonial' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
