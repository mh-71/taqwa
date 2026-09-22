// Email service for booking notifications
// Uses Cloudflare Email Routing Workers binding

import type { Booking } from './booking-db';
import {
  getConfirmationEmailHTML,
  getConfirmationEmailText,
  getCancellationEmailHTML,
  getCancellationEmailText,
} from './email-templates';

export type EmailBindingType = {
  send(message: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<{ id: string }>;
};

/**
 * Send booking confirmation email
 * Called when admin changes status from pending to confirmed
 */
export async function sendConfirmationEmail(
  emailBinding: EmailBindingType | undefined,
  booking: Booking
): Promise<{ success: boolean; error?: string }> {
  // Skip if EMAIL binding is not configured
  if (!emailBinding) {
    return {
      success: false,
      error: 'Email service not configured (EMAIL binding missing)',
    };
  }

  // Skip if customer did not provide email
  if (!booking.email) {
    return {
      success: true, // Not an error, just no email to send
    };
  }

  try {
    const subject = 'Booking Confirmed — Taqwa Automobile Service Center';
    const html = getConfirmationEmailHTML(booking);
    const text = getConfirmationEmailText(booking);

    await emailBinding.send({
      from: 'bookings@taqwa.autos',
      to: booking.email,
      subject,
      text,
      html,
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Email send error for booking ${booking.id}:`, errorMessage);
    return {
      success: false,
      error: `Failed to send confirmation email: ${errorMessage}`,
    };
  }
}

/**
 * Send booking cancellation email
 * Called when admin changes status to cancelled
 */
export async function sendCancellationEmail(
  emailBinding: EmailBindingType | undefined,
  booking: Booking
): Promise<{ success: boolean; error?: string }> {
  // Skip if EMAIL binding is not configured
  if (!emailBinding) {
    return {
      success: false,
      error: 'Email service not configured (EMAIL binding missing)',
    };
  }

  // Skip if customer did not provide email
  if (!booking.email) {
    return {
      success: true, // Not an error, just no email to send
    };
  }

  try {
    const subject = 'Booking Cancelled — Taqwa Automobile Service Center';
    const html = getCancellationEmailHTML(booking);
    const text = getCancellationEmailText(booking);

    await emailBinding.send({
      from: 'bookings@taqwa.autos',
      to: booking.email,
      subject,
      text,
      html,
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Email send error for booking ${booking.id}:`, errorMessage);
    return {
      success: false,
      error: `Failed to send cancellation email: ${errorMessage}`,
    };
  }
}

/**
 * Determine if an email should be sent based on status change
 */
export function shouldSendEmail(
  oldStatus: string,
  newStatus: string
): 'confirmation' | 'cancellation' | null {
  // Send confirmation when changing from pending to confirmed
  if (oldStatus === 'pending' && newStatus === 'confirmed') {
    return 'confirmation';
  }

  // Send cancellation when changing to cancelled (from any status)
  if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
    return 'cancellation';
  }

  // Do not send for other transitions
  return null;
}
