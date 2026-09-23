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
    return {
      channel: 'sms',
      status: 'disabled',
      message: 'SMS notifications are currently disabled'
    };
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
