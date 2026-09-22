import type { APIRoute } from 'astro';
import { createBooking } from '../../../lib/booking-db';

export const prerender = false;

const ALLOWED_SERVICES = [
  'lpg-conversion',
  'cng-conversion',
  'engine-repair',
  'car-ac',
  'battery-electrical',
  'denting-painting',
  'car-wash',
  'periodic-maintenance',
  'hybrid',
  'other',
];

function validatePhoneNumber(phone: string): boolean {
  // Bangladesh phone format: 01XXX-XXXXXX or 01XXXXXXXXX
  const phoneRegex = /^01\d{9,10}$/;
  return phoneRegex.test(phone.replace(/[^\d]/g, ''));
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today && !isNaN(date.getTime());
}

function validateTime(timeStr: string): boolean {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // ===== EXTRACT RUNTIME & DATABASE =====
    const runtime = (locals as any).runtime;
    if (!runtime) {
      return new Response(
        JSON.stringify({ error: 'Booking service not available' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = runtime.env.DB;

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
    if (formData.website || formData.company) {
      return new Response(
        JSON.stringify({ error: 'Invalid submission' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ===== VALIDATE REQUIRED FIELDS =====
    const name = (formData.name || '').trim();
    const phoneNumber = (formData.phoneNumber || '').trim();
    const vehicleMake = (formData.vehicleMake || '').trim();
    const vehicleModel = (formData.vehicleModel || '').trim();
    const serviceType = (formData.serviceType || '').trim();
    const preferredDate = (formData.preferredDate || '').trim();
    const preferredTime = (formData.preferredTime || '').trim();

    const email = (formData.email || '').trim();
    const registrationNo = (formData.registrationNo || '').trim();
    const message = (formData.message || '').trim();

    // ===== VALIDATION =====
    if (!name || name.length < 2 || name.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Name must be 2-100 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (email && !validateEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!vehicleMake || vehicleMake.length < 2 || vehicleMake.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Vehicle make must be 2-50 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!vehicleModel || vehicleModel.length < 2 || vehicleModel.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Vehicle model must be 2-50 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!serviceType || !ALLOWED_SERVICES.includes(serviceType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid service type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!preferredDate || !validateDate(preferredDate)) {
      return new Response(
        JSON.stringify({ error: 'Invalid date (must be today or later)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!preferredTime || !validateTime(preferredTime)) {
      return new Response(
        JSON.stringify({ error: 'Invalid time format (HH:MM)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (registrationNo && registrationNo.length > 20) {
      return new Response(
        JSON.stringify({ error: 'Registration number too long' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (message && message.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Message too long (max 1000 characters)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ===== CREATE BOOKING =====
    try {
      const bookingId = await createBooking(db, {
        name,
        phone_number: phoneNumber,
        email: email || undefined,
        vehicle_make: vehicleMake,
        vehicle_model: vehicleModel,
        registration_no: registrationNo || undefined,
        service_type: serviceType,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        message: message || undefined,
      });

      return new Response(
        JSON.stringify({
          success: true,
          bookingId,
          message: 'Booking submitted successfully. We will confirm shortly.',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (dbError) {
      console.error('Booking creation error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save booking. Please try again.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Booking API error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
