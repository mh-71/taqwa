// SMS notification provider
// Uses Twilio API in production, mocks in development

import type { NotificationProvider, NotificationRequest, NotificationResult, ProviderEnvironment } from './types';

export class SmsProvider implements NotificationProvider {
  private accountSid: string | undefined;
  private authToken: string | undefined;
  private phoneNumber: string | undefined;
  private mode: 'production' | 'development' | 'mock';

  constructor(env?: ProviderEnvironment, mode?: string) {
    this.accountSid = env?.TWILIO_ACCOUNT_SID;
    this.authToken = env?.TWILIO_AUTH_TOKEN;
    this.phoneNumber = env?.TWILIO_PHONE_NUMBER;
    this.mode = (mode as any) || 'production';
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    const { booking, type } = request;

    // Skip if no phone number
    if (!booking.phone_number) {
      return {
        channel: 'sms',
        status: 'skipped',
        message: 'No phone number provided'
      };
    }

    // In mock/development mode, don't actually send
    if (this.mode === 'mock' || this.mode === 'development') {
      const message = this.formatMessage(booking, type);
      console.log(`[SMS] Mock mode - not sending to ${booking.phone_number}`);
      console.log(`[SMS] Message: "${message}"`);
      return {
        channel: 'sms',
        status: this.mode === 'mock' ? 'mock' : 'skipped',
        message: `Mock SMS to ${booking.phone_number}`
      };
    }

    // Production: attempt to send via Twilio
    if (!this.accountSid || !this.authToken || !this.phoneNumber) {
      return {
        channel: 'sms',
        status: 'failed',
        error: 'Twilio credentials not configured'
      };
    }

    try {
      const message = this.formatMessage(booking, type);
      const response = await this.sendViaTwilio(booking.phone_number, message);

      return {
        channel: 'sms',
        status: 'sent',
        message: `SMS sent to ${booking.phone_number} (SID: ${response.sid})`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`SMS send failed for booking ${booking.id}:`, errorMessage);
      return {
        channel: 'sms',
        status: 'failed',
        error: `Failed to send SMS: ${errorMessage}`
      };
    }
  }

  private formatMessage(booking: any, type: string): string {
    const status = type === 'confirmation' ? 'Confirmed' : 'Cancelled';
    return `Taqwa Automobile | Booking #${String(booking.id).padStart(4, '0')} ${status}\nService: ${booking.service_type}\nDate: ${booking.preferred_date} | Time: ${booking.preferred_time}\nhttps://taqwa.autos`;
  }

  private async sendViaTwilio(
    phoneNumber: string,
    message: string
  ): Promise<{ sid: string }> {
    // In production, this would call Twilio API
    // For now, this is a placeholder that will be called only in production mode
    // when credentials are available

    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
    const bodyData = new URLSearchParams({
      From: this.phoneNumber!,
      To: phoneNumber,
      Body: message
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyData.toString()
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twilio API error: ${error}`);
    }

    const data = (await response.json()) as { sid: string };
    return data;
  }
}
