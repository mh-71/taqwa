// Email templates for booking notifications
// Both HTML and plain text formats

import type { Booking } from './booking-db';

interface EmailTemplateData extends Booking {}

/**
 * Generate confirmation email HTML
 * Sent when admin confirms a booking (pending → confirmed)
 */
export function getConfirmationEmailHTML(booking: EmailTemplateData): string {
  const registrationDisplay = booking.registration_no
    ? `<tr>
        <td style="padding: 8px 0; color: #666; font-size: 14px;">Registration Number:</td>
        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${escapeHtml(booking.registration_no)}</td>
      </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" style="margin: 0; padding: 0;">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed - Taqwa Automobile Service Center</title>
</head>
<body style="margin: 0; padding: 0; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); border-radius: 12px 12px 0 0; padding: 40px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">Booking Confirmed</h1>
      <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Taqwa Automobile Service Center</p>
    </div>

    <!-- Main Content -->
    <div style="background: white; padding: 32px 20px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
      <p style="margin: 0 0 24px 0; color: #333; font-size: 15px; line-height: 1.6;">
        Hi ${escapeHtml(booking.name)},<br><br>
        Great news! Your booking has been confirmed. Our team will prepare your vehicle for the requested service. Please see the details below and contact us if you need to reschedule.
      </p>

      <!-- Booking Details -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 16px 0; color: #333; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Booking Details</h3>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px;">Booking ID:</td>
            <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">BK-${String(booking.id).padStart(4, '0')}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; border-bottom: 1px solid #f1f5f9;">Your Name:</td>
            <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; border-bottom: 1px solid #f1f5f9;">${escapeHtml(booking.name)}</td>
          </tr>
        </table>
      </div>

      <!-- Vehicle & Service Details -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 16px 0; color: #333; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Vehicle & Service</h3>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px;">Vehicle Make:</td>
            <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${escapeHtml(booking.vehicle_make)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px;">Vehicle Model:</td>
            <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${escapeHtml(booking.vehicle_model)}</td>
          </tr>
          ${registrationDisplay}
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; border-bottom: 1px solid #f1f5f9;">Service Type:</td>
            <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; border-bottom: 1px solid #f1f5f9;">${escapeHtml(booking.service_type)}</td>
          </tr>
        </table>
      </div>

      <!-- Appointment Details -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 16px 0; color: #333; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Appointment Details</h3>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px;">Preferred Date:</td>
            <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${formatDate(booking.preferred_date)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; border-bottom: 1px solid #f1f5f9;">Preferred Time:</td>
            <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; border-bottom: 1px solid #f1f5f9;">${escapeHtml(booking.preferred_time)}</td>
          </tr>
        </table>
      </div>

      <!-- Call to Action -->
      <p style="margin: 24px 0; color: #333; font-size: 15px; line-height: 1.6;">
        If you need to reschedule or have any questions, please contact us directly or visit our website.
      </p>

      <!-- Footer -->
      <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0; margin-top: 24px;">
        <p style="margin: 0; color: #666; font-size: 13px;">
          Taqwa Automobile Service Center<br>
          Website: <a href="https://taqwa.autos" style="color: #F97316; text-decoration: none;">https://taqwa.autos</a><br><br>
          <span style="color: #999; font-size: 12px;">This is an automated confirmation email. Please do not reply to this address.</span>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate confirmation email plain text
 */
export function getConfirmationEmailText(booking: EmailTemplateData): string {
  const registrationDisplay = booking.registration_no
    ? `\nRegistration Number: ${booking.registration_no}`
    : '';

  return `BOOKING CONFIRMED
Taqwa Automobile Service Center

Hello ${booking.name},

Great news! Your booking has been confirmed. Our team will prepare your vehicle for the requested service. Please see the details below and contact us if you need to reschedule.

BOOKING DETAILS
================
Booking ID: BK-${String(booking.id).padStart(4, '0')}
Your Name: ${booking.name}

VEHICLE & SERVICE
=================
Vehicle Make: ${booking.vehicle_make}
Vehicle Model: ${booking.vehicle_model}${registrationDisplay}
Service Type: ${booking.service_type}

APPOINTMENT DETAILS
===================
Preferred Date: ${formatDate(booking.preferred_date)}
Preferred Time: ${booking.preferred_time}

If you need to reschedule or have any questions, please contact us directly or visit our website.

---
Taqwa Automobile Service Center
Website: https://taqwa.autos

This is an automated confirmation email. Please do not reply to this address.`;
}

/**
 * Generate cancellation email HTML
 * Sent when a booking is cancelled
 */
export function getCancellationEmailHTML(booking: EmailTemplateData): string {
  const registrationDisplay = booking.registration_no
    ? `<tr>
        <td style="padding: 8px 0; color: #666; font-size: 14px;">Registration Number:</td>
        <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${escapeHtml(booking.registration_no)}</td>
      </tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" style="margin: 0; padding: 0;">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Cancelled - Taqwa Automobile Service Center</title>
</head>
<body style="margin: 0; padding: 0; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); border-radius: 12px 12px 0 0; padding: 40px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">Booking Cancelled</h1>
      <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Taqwa Automobile Service Center</p>
    </div>

    <!-- Main Content -->
    <div style="background: white; padding: 32px 20px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
      <p style="margin: 0 0 24px 0; color: #333; font-size: 15px; line-height: 1.6;">
        Hi ${escapeHtml(booking.name)},<br><br>
        Your booking with Taqwa Automobile Service Center has been cancelled. See the details below. If you have any questions or would like to reschedule, please contact us.
      </p>

      <!-- Booking Details -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 16px 0; color: #333; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Cancelled Booking Details</h3>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px;">Booking ID:</td>
            <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; font-weight: 600;">BK-${String(booking.id).padStart(4, '0')}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; border-bottom: 1px solid #f1f5f9;">Your Name:</td>
            <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; border-bottom: 1px solid #f1f5f9;">${escapeHtml(booking.name)}</td>
          </tr>
        </table>
      </div>

      <!-- Vehicle & Service Details -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 16px 0; color: #333; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Vehicle & Service</h3>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px;">Vehicle Make:</td>
            <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${escapeHtml(booking.vehicle_make)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px;">Vehicle Model:</td>
            <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${escapeHtml(booking.vehicle_model)}</td>
          </tr>
          ${registrationDisplay}
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; border-bottom: 1px solid #f1f5f9;">Service Type:</td>
            <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; border-bottom: 1px solid #f1f5f9;">${escapeHtml(booking.service_type)}</td>
          </tr>
        </table>
      </div>

      <!-- Appointment Details -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 16px 0; color: #333; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Appointment Details</h3>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px;">Preferred Date:</td>
            <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right;">${formatDate(booking.preferred_date)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666; font-size: 14px; border-bottom: 1px solid #f1f5f9;">Preferred Time:</td>
            <td style="padding: 8px 0; color: #333; font-size: 14px; text-align: right; border-bottom: 1px solid #f1f5f9;">${escapeHtml(booking.preferred_time)}</td>
          </tr>
        </table>
      </div>

      <!-- Call to Action -->
      <p style="margin: 24px 0; color: #333; font-size: 15px; line-height: 1.6;">
        If you would like to reschedule or have any questions, please contact us directly. We'd be happy to help you book another appointment.
      </p>

      <!-- Footer -->
      <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0; margin-top: 24px;">
        <p style="margin: 0; color: #666; font-size: 13px;">
          Taqwa Automobile Service Center<br>
          Website: <a href="https://taqwa.autos" style="color: #F97316; text-decoration: none;">https://taqwa.autos</a><br><br>
          <span style="color: #999; font-size: 12px;">This is an automated cancellation email. Please do not reply to this address.</span>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate cancellation email plain text
 */
export function getCancellationEmailText(booking: EmailTemplateData): string {
  const registrationDisplay = booking.registration_no
    ? `\nRegistration Number: ${booking.registration_no}`
    : '';

  return `BOOKING CANCELLED
Taqwa Automobile Service Center

Hello ${booking.name},

Your booking with Taqwa Automobile Service Center has been cancelled. See the details below. If you have any questions or would like to reschedule, please contact us.

CANCELLED BOOKING DETAILS
=========================
Booking ID: BK-${String(booking.id).padStart(4, '0')}
Your Name: ${booking.name}

VEHICLE & SERVICE
=================
Vehicle Make: ${booking.vehicle_make}
Vehicle Model: ${booking.vehicle_model}${registrationDisplay}
Service Type: ${booking.service_type}

APPOINTMENT DETAILS
===================
Preferred Date: ${formatDate(booking.preferred_date)}
Preferred Time: ${booking.preferred_time}

If you would like to reschedule or have any questions, please contact us directly. We'd be happy to help you book another appointment.

---
Taqwa Automobile Service Center
Website: https://taqwa.autos

This is an automated cancellation email. Please do not reply to this address.`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Format date for email display
 */
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  } catch {
    return dateStr;
  }
}
