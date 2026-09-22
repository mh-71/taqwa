// Mock notification provider for safe local/development testing
// Never sends real messages. Logs safely for testing purposes.

import type { NotificationProvider, NotificationRequest, NotificationResult } from './types';

/**
 * Mock Email Provider
 * Safe for local development - logs message details without sending
 */
export class MockEmailProvider implements NotificationProvider {
  async send(request: NotificationRequest): Promise<NotificationResult> {
    const { booking, type } = request;

    // Skip if no email
    if (!booking.email) {
      console.log(`[Mock Email] Skipped (no email address for booking ${booking.id})`);
      return {
        channel: 'email',
        status: 'skipped',
        message: 'No email address provided'
      };
    }

    // Log the mock notification (safe - no credentials exposed)
    const subject = type === 'confirmation'
      ? 'Booking Confirmed — Taqwa Automobile Service Center'
      : 'Booking Cancelled — Taqwa Automobile Service Center';

    console.log(`[Mock Email] Notification`);
    console.log(`  Channel: Email`);
    console.log(`  To: ${booking.email}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Booking ID: BK-${String(booking.id).padStart(4, '0')}`);
    console.log(`  Customer: ${booking.name}`);
    console.log(`  Vehicle: ${booking.vehicle_make} ${booking.vehicle_model}`);
    console.log(`  Service: ${booking.service_type}`);
    console.log(`  Status: ${type}`);
    console.log(`  Mode: MOCK (not sent)`);
    console.log('');

    return {
      channel: 'email',
      status: 'mock',
      message: `Mock email to ${booking.email}`
    };
  }
}

/**
 * Mock SMS Provider
 * Safe for local development - logs message content without sending
 */
export class MockSmsProvider implements NotificationProvider {
  async send(request: NotificationRequest): Promise<NotificationResult> {
    const { booking, type } = request;

    // Skip if no phone
    if (!booking.phone_number) {
      console.log(`[Mock SMS] Skipped (no phone number for booking ${booking.id})`);
      return {
        channel: 'sms',
        status: 'skipped',
        message: 'No phone number provided'
      };
    }

    // Format SMS message
    const status = type === 'confirmation' ? 'Confirmed' : 'Cancelled';
    const smsMessage = `Taqwa Automobile | Booking #${String(booking.id).padStart(4, '0')} ${status}\nService: ${booking.service_type}\nDate: ${booking.preferred_date} | Time: ${booking.preferred_time}\nhttps://taqwa.autos`;

    console.log(`[Mock SMS] Notification`);
    console.log(`  Channel: SMS`);
    console.log(`  To: ${booking.phone_number}`);
    console.log(`  Message: "${smsMessage}"`);
    console.log(`  Length: ${smsMessage.length} chars`);
    console.log(`  Status: ${type}`);
    console.log(`  Mode: MOCK (not sent)`);
    console.log('');

    return {
      channel: 'sms',
      status: 'mock',
      message: `Mock SMS to ${booking.phone_number}`
    };
  }
}

/**
 * Mock WhatsApp Provider
 * Safe for local development - logs template info without sending
 */
export class MockWhatsAppProvider implements NotificationProvider {
  async send(request: NotificationRequest): Promise<NotificationResult> {
    const { booking, type } = request;

    // Skip if no phone
    if (!booking.phone_number) {
      console.log(`[Mock WhatsApp] Skipped (no phone number for booking ${booking.id})`);
      return {
        channel: 'whatsapp',
        status: 'skipped',
        message: 'No phone number provided'
      };
    }

    // Log the mock notification
    const templateName = type === 'confirmation'
      ? 'booking_confirmation'
      : 'booking_cancellation';

    console.log(`[Mock WhatsApp] Notification`);
    console.log(`  Channel: WhatsApp Business API`);
    console.log(`  To: ${booking.phone_number}`);
    console.log(`  Template: ${templateName}`);
    console.log(`  Parameters:`);
    console.log(`    - Customer Name: ${booking.name}`);
    console.log(`    - Booking ID: BK-${String(booking.id).padStart(4, '0')}`);
    console.log(`    - Vehicle: ${booking.vehicle_make} ${booking.vehicle_model}`);
    console.log(`    - Service: ${booking.service_type}`);
    console.log(`    - Date: ${booking.preferred_date}`);
    console.log(`    - Time: ${booking.preferred_time}`);
    console.log(`  Status: ${type}`);
    console.log(`  Mode: MOCK (not sent)`);
    console.log('');

    return {
      channel: 'whatsapp',
      status: 'mock',
      message: `Mock WhatsApp to ${booking.phone_number} using template ${templateName}`
    };
  }
}
