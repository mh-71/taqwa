// Email notification provider
// Uses Cloudflare EMAIL binding in production, mocks in development

import type { NotificationProvider, NotificationRequest, NotificationResult, EmailBindingType } from './types';
import { getConfirmationEmailHTML, getConfirmationEmailText, getCancellationEmailHTML, getCancellationEmailText } from '../email-templates';

export class EmailProvider implements NotificationProvider {
  private emailBinding: EmailBindingType | undefined;
  private mode: 'production' | 'development' | 'mock';

  constructor(emailBinding?: EmailBindingType, mode?: string) {
    this.emailBinding = emailBinding;
    this.mode = (mode as any) || 'production';
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    const { booking, type } = request;

    // Skip if no email address
    if (!booking.email) {
      return {
        channel: 'email',
        status: 'skipped',
        message: 'No email address provided'
      };
    }

    // In mock mode, don't actually send
    if (this.mode === 'mock' || this.mode === 'development') {
      console.log(`[Email] Mock mode - not sending to ${booking.email}`);
      return {
        channel: 'email',
        status: this.mode === 'mock' ? 'mock' : 'skipped',
        message: `Mock email to ${booking.email}`
      };
    }

    // Production: attempt to send via Cloudflare EMAIL binding
    if (!this.emailBinding) {
      return {
        channel: 'email',
        status: 'failed',
        error: 'EMAIL binding not configured'
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

      await this.emailBinding.send({
        from: 'bookings@taqwa.autos',
        to: booking.email,
        subject,
        text,
        html
      });

      return {
        channel: 'email',
        status: 'sent',
        message: `Email sent to ${booking.email}`
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
