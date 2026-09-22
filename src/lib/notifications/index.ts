// Multi-channel notification service
// Orchestrates Email, SMS, and WhatsApp notifications
// Safe for production with graceful failure handling

import type { Booking } from '../booking-db';
import type { NotificationResponse, NotificationMode, ProviderEnvironment } from './types';
import { EmailProvider } from './email-provider';
import { SmsProvider } from './sms-provider';
import { WhatsAppProvider } from './whatsapp-provider';
import { MockEmailProvider, MockSmsProvider, MockWhatsAppProvider } from './mock-provider';

/**
 * Determine if notifications should be sent based on status transition
 */
export function shouldNotify(
  oldStatus: string,
  newStatus: string
): 'confirmation' | 'cancellation' | null {
  // Send confirmation when changing from pending to confirmed
  if (oldStatus === 'pending' && newStatus === 'confirmed') {
    return 'confirmation';
  }

  // Send cancellation when changing to cancelled (from any status except already cancelled)
  if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
    return 'cancellation';
  }

  // Do not send for other transitions (including completed)
  return null;
}

/**
 * Send multi-channel notifications for booking status changes
 * Gracefully handles individual channel failures
 *
 * IMPORTANT:
 * - This is called AFTER booking status is updated in D1
 * - Individual channel failures do NOT cause the API to fail
 * - All results are logged and reported in the response
 */
export async function sendNotifications(
  booking: Booking,
  type: 'confirmation' | 'cancellation',
  env: ProviderEnvironment
): Promise<NotificationResponse> {
  const mode: NotificationMode = (env.NOTIFICATION_MODE as NotificationMode) || 'production';

  // Log notification attempt
  console.log(`[Notifications] Sending ${type} notifications for booking ${booking.id} (mode: ${mode})`);

  // Use mock providers if in mock or development mode
  const isMockMode = mode === 'mock' || mode === 'development';

  let emailResult, smsResult, whatsappResult;

  // Send Email
  try {
    const emailProvider = isMockMode
      ? new MockEmailProvider()
      : new EmailProvider(env.EMAIL, mode);
    emailResult = await emailProvider.send({ booking, type, mode });
    if (emailResult.error) {
      console.warn(`[Notifications] Email failed: ${emailResult.error}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Notifications] Email exception: ${errorMessage}`);
    emailResult = {
      channel: 'email' as const,
      status: 'failed' as const,
      error: `Email exception: ${errorMessage}`
    };
  }

  // Send SMS
  try {
    const smsProvider = isMockMode
      ? new MockSmsProvider()
      : new SmsProvider(env, mode);
    smsResult = await smsProvider.send({ booking, type, mode });
    if (smsResult.error) {
      console.warn(`[Notifications] SMS failed: ${smsResult.error}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Notifications] SMS exception: ${errorMessage}`);
    smsResult = {
      channel: 'sms' as const,
      status: 'failed' as const,
      error: `SMS exception: ${errorMessage}`
    };
  }

  // Send WhatsApp
  try {
    const whatsappProvider = isMockMode
      ? new MockWhatsAppProvider()
      : new WhatsAppProvider(env, mode);
    whatsappResult = await whatsappProvider.send({ booking, type, mode });
    if (whatsappResult.error) {
      console.warn(`[Notifications] WhatsApp failed: ${whatsappResult.error}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Notifications] WhatsApp exception: ${errorMessage}`);
    whatsappResult = {
      channel: 'whatsapp' as const,
      status: 'failed' as const,
      error: `WhatsApp exception: ${errorMessage}`
    };
  }

  // Build response
  const errors: Record<string, string> = {};
  if (emailResult.error) errors.email = emailResult.error;
  if (smsResult.error) errors.sms = smsResult.error;
  if (whatsappResult.error) errors.whatsapp = whatsappResult.error;

  return {
    success: true, // Status update succeeded even if notifications failed
    bookingStatus: booking.status,
    notifications: {
      email: emailResult.status,
      sms: smsResult.status,
      whatsapp: whatsappResult.status
    },
    ...(Object.keys(errors).length > 0 && { errors })
  };
}

/**
 * Export types for use in API endpoints
 */
export type { NotificationResponse, NotificationMode };
