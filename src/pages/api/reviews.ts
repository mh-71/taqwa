import type { APIRoute } from 'astro';
import { createTestimonial } from '../../lib/testimonial-db';
import { sanitizeHtml } from '../../lib/sanitize-html';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // ===== CSRF PROTECTION: verify request comes from our site =====
  const referer = request.headers.get('referer');
  const origin = request.headers.get('origin');

  const isValidOrigin = !origin || origin.includes('taqwa.autos') || origin.includes('localhost') || origin.includes('127.0.0.1');
  const isValidReferer = !referer || referer.includes('taqwa.autos') || referer.includes('localhost') || referer.includes('127.0.0.1');

  if (!isValidOrigin && !isValidReferer) {
    return new Response(JSON.stringify({ error: 'Invalid request origin' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const form = await request.formData();

    // ===== HONEYPOT SPAM PROTECTION =====
    const honeypot = String(form.get('website') || '').trim();
    if (honeypot) {
      return new Response(JSON.stringify({ error: 'Invalid submission' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ===== EXTRACT & VALIDATE FORM DATA =====
    const name = String(form.get('name') || '').trim();
    const location = String(form.get('location') || '').trim();
    const ratingStr = String(form.get('rating') || '').trim();
    const review = String(form.get('review') || '').trim();

    // Validation
    if (!name || name.length < 2 || name.length > 100) {
      return new Response(JSON.stringify({ error: 'Name must be 2-100 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (location && location.length > 100) {
      return new Response(JSON.stringify({ error: 'Location must be under 100 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const rating = parseInt(ratingStr);
    if (![1, 2, 3, 4, 5].includes(rating)) {
      return new Response(JSON.stringify({ error: 'Rating must be 1-5' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!review || review.length < 10 || review.length > 1000) {
      return new Response(JSON.stringify({ error: 'Review must be 10-1000 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ===== SANITIZATION & SECURITY =====
    const cleanName = sanitizeHtml(name);
    const cleanLocation = location ? sanitizeHtml(location) : null;
    const cleanReview = sanitizeHtml(review);

    // ===== SAVE TO DATABASE =====
    const runtime = (locals as any).runtime;

    if (!runtime) {
      return new Response(JSON.stringify({ error: 'Review system unavailable' }), {
        status: 501,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = runtime.env.DB;
    const testimonialId = await createTestimonial(db, {
      name: cleanName,
      location: cleanLocation,
      rating,
      review: cleanReview
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Thank you for your feedback. Your review will appear once it\'s approved by our team.',
      testimonialId
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Review submission error:', error);
    return new Response(JSON.stringify({ error: 'Failed to submit review' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
