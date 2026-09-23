// Email notification provider
// Uses Resend API in production, mocks in development

import type { NotificationProvider, NotificationRequest, NotificationResult } from './types';
import { getConfirmationEmailHTML, getConfirmationEmailText, getCancellationEmailHTML, getCancellationEmailText } from '../email-templates';

export class EmailProvider implements NotificationProvider {
  private apiKey: string | undefined;
  private mode: 'production' | 'development' | 'mock';

  constructor(apiKey?: string, mode?: string) {
    this.apiKey = apiKey;
    this.mode = (mode as any) || 'production';
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    const { booking, type } = request;

    if (!booking.email) {
      return {
        channel: 'email',
        status: 'skipped',
        message: 'No email address provided'
      };
    }

    if (this.mode === 'mock' || this.mode === 'development') {
      console.log(`[Email] Mock mode - not sending to ${booking.email}`);
      return {
        channel: 'email',
        status: this.mode === 'mock' ? 'mock' : 'skipped',
        message: `Mock email to ${booking.email}`
      };
    }

    if (!this.apiKey) {
      return {
        channel: 'email',
        status: 'failed',
        error: 'RESEND_API_KEY not configured'
      };
    }

    try {
      const subject = type === 'confirmation'
        ? 'Booking Confirmed — Taqwa Automobile Service Center'
        : 'Booking Cancelled — Taqwa Automobile Service Center';

      const html = type === 'confirmation'
        ? getConfirmationEmailHTML(booking)
        : getCancellationEmailHTML(booking);

      const text = type === 'confirmation'
        ? getConfirmationEmailText(booking)
        : getCancellationEmailText(booking);

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'bookings@taqwa.autos',
          to: booking.email,
          subject,
          html,
          text
        })
      });

      if (!response.ok) {
        const rawBody = await response.text();

        let errorDetail = rawBody || 'No error details provided';

        try {
          const parsed = JSON.parse(rawBody);
          errorDetail =
            parsed?.message ||
            parsed?.error ||
            rawBody ||
            'No error details provided';
        } catch {
          // Keep rawBody as the error detail when response is not JSON
        }

        throw new Error(
          `Resend API error (HTTP ${response.status}): ${errorDetail}`
        );
      }

      const data = (await response.json()) as { id: string };

      return {
        channel: 'email',
        status: 'sent',
        message: `Email sent to ${booking.email} (Message ID: ${data.id})`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Email send failed for booking ${booking.id}:`, errorMessage);
      return {
        channel: 'email',
        status: 'failed',
        error: `Failed to send email: ${errorMessage}`
      };
    }
  }
}
