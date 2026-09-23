// Notification service
// Currently: Email only via Resend
// SMS and WhatsApp: disabled (reserved for future use)
// Safe for production with graceful failure handling

import type { Booking } from '../booking-db';
import type { NotificationResponse, NotificationMode, ProviderEnvironment } from './types';
import { EmailProvider } from './email-provider';
import { MockEmailProvider } from './mock-provider';

export function shouldNotify(
  oldStatus: string,
  newStatus: string
): 'confirmation' | 'cancellation' | null {
  if (oldStatus === 'pending' && newStatus === 'confirmed') {
    return 'confirmation';
  }

  if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
    return 'cancellation';
  }

  return null;
}

export async function sendNotifications(
  booking: Booking,
  type: 'confirmation' | 'cancellation',
  env: ProviderEnvironment
): Promise<NotificationResponse> {
  const mode: NotificationMode = (env.NOTIFICATION_MODE as NotificationMode) || 'production';

  console.log(`[Notifications] Sending ${type} notifications for booking ${booking.id} (mode: ${mode})`);

  const isMockMode = mode === 'mock' || mode === 'development';

  let emailResult;

  try {
    const emailProvider = isMockMode
      ? new MockEmailProvider()
      : new EmailProvider(env.RESEND_API_KEY, mode);
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

  const errors: Record<string, string> = {};
  if (emailResult.error) errors.email = emailResult.error;

  return {
    success: true,
    bookingStatus: booking.status,
    notifications: {
      email: emailResult.status,
      sms: 'disabled',
      whatsapp: 'disabled'
    },
    ...(Object.keys(errors).length > 0 && { errors })
  };
}

export type { NotificationResponse, NotificationMode };
