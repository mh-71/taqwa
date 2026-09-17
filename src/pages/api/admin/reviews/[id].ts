import type { APIRoute } from 'astro';
import { getTestimonialById, updateTestimonial, updateTestimonialStatus, deleteTestimonial } from '../../../../lib/testimonial-db';
import { verifySessionToken } from '../../../../lib/auth';

export const prerender = false;

export function getStaticPaths() {
  return [];
}

async function verifyAuth(request: Request, runtime: any): Promise<boolean> {
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionCookie = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('taqwa_admin_session='));

  if (!sessionCookie) return false;

  const token = sessionCookie.split('=')[1];
  const secret = runtime.env.ADMIN_SESSION_SECRET;
  return await verifySessionToken(secret, token);
}

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const runtime = (locals as any).runtime;
  if (!runtime) {
    return new Response('Admin API is only available on the Cloudflare deployment.', { status: 501 });
  }

  if (!(await verifyAuth(request, runtime))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const db = runtime.env.DB;
    const id = Number(params.id);

    if (!Number.isFinite(id)) {
      return new Response(JSON.stringify({ error: 'Invalid review id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as any;
    const { name, location, rating, review, status } = body;

    // Check if review exists
    const existing = await getTestimonialById(db, id);
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Review not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle status update (for approve/reject)
    if (status && !name && !rating) {
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return new Response(JSON.stringify({ error: 'Invalid status' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const success = await updateTestimonialStatus(db, id, status as 'pending' | 'approved' | 'rejected');
      if (!success) {
        return new Response(JSON.stringify({ error: 'Failed to update status' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const updated = await getTestimonialById(db, id);
      return new Response(JSON.stringify(updated), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle content update (for edit)
    if (!name || typeof name !== 'string' || !name.trim()) {
      return new Response(JSON.stringify({ error: 'Name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (rating === undefined || rating === null || !Number.isFinite(rating) || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ error: 'Rating must be between 1 and 5' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!review || typeof review !== 'string' || !review.trim()) {
      return new Response(JSON.stringify({ error: 'Review text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update review fields
    const success = await updateTestimonial(db, id, {
      name: name.trim(),
      location: location ? (location as string).trim() : undefined,
      rating: Number(rating),
      review: review.trim()
    });

    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to update review' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updated = await getTestimonialById(db, id);
    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return new Response(JSON.stringify({ error: 'Failed to update review' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ params, request, locals }) => {
  const runtime = (locals as any).runtime;
  if (!runtime) {
    return new Response('Admin API is only available on the Cloudflare deployment.', { status: 501 });
  }

  if (!(await verifyAuth(request, runtime))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const db = runtime.env.DB;
    const id = Number(params.id);

    if (!Number.isFinite(id)) {
      return new Response(JSON.stringify({ error: 'Invalid review id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const success = await deleteTestimonial(db, id);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete review' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete review' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
