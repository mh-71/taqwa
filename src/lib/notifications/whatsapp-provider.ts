// WhatsApp notification provider
// Uses Meta WhatsApp Business Platform API in production, mocks in development

import type { NotificationProvider, NotificationRequest, NotificationResult, ProviderEnvironment } from './types';

export class WhatsAppProvider implements NotificationProvider {
  private businessAccountId: string | undefined;
  private phoneNumberId: string | undefined;
  private accessToken: string | undefined;
  private mode: 'production' | 'development' | 'mock';

  constructor(env?: ProviderEnvironment, mode?: string) {
    this.businessAccountId = env?.WHATSAPP_BUSINESS_ACCOUNT_ID;
    this.phoneNumberId = env?.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = env?.WHATSAPP_API_ACCESS_TOKEN;
    this.mode = (mode as any) || 'production';
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    const { booking, type } = request;

    // Skip if no phone number
    if (!booking.phone_number) {
      return {
        channel: 'whatsapp',
        status: 'skipped',
        message: 'No phone number provided'
      };
    }

    // In mock/development mode, don't actually send
    if (this.mode === 'mock' || this.mode === 'development') {
      const templateName = type === 'confirmation'
        ? 'booking_confirmation'
        : 'booking_cancellation';

      console.log(`[WhatsApp] Mock mode - not sending to ${booking.phone_number}`);
      console.log(`[WhatsApp] Template: ${templateName}`);
      console.log(`[WhatsApp] Booking: BK-${String(booking.id).padStart(4, '0')}`);
      return {
        channel: 'whatsapp',
        status: this.mode === 'mock' ? 'mock' : 'skipped',
        message: `Mock WhatsApp to ${booking.phone_number} using template ${templateName}`
      };
    }

    // Production: attempt to send via Meta WhatsApp Business API
    if (!this.businessAccountId || !this.phoneNumberId || !this.accessToken) {
      return {
        channel: 'whatsapp',
        status: 'failed',
        error: 'WhatsApp Business credentials not configured'
      };
    }

    try {
      const templateName = type === 'confirmation'
        ? 'booking_confirmation'
        : 'booking_cancellation';

      const response = await this.sendViaMetaWhatsApp(
        booking.phone_number,
        templateName,
        booking
      );

      return {
        channel: 'whatsapp',
        status: 'sent',
        message: `WhatsApp sent to ${booking.phone_number} (Message ID: ${response.messages[0].id})`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`WhatsApp send failed for booking ${booking.id}:`, errorMessage);
      return {
        channel: 'whatsapp',
        status: 'failed',
        error: `Failed to send WhatsApp: ${errorMessage}`
      };
    }
  }

  private async sendViaMetaWhatsApp(
    phoneNumber: string,
    templateName: string,
    booking: any
  ): Promise<{ messages: Array<{ id: string }> }> {
    // In production, this would call Meta WhatsApp Business API
    // For now, this is a placeholder that will be called only in production mode
    // when credentials are available

    // Normalize phone number (remove +, add 880 for Bangladesh)
    let normalizedNumber = phoneNumber.replace(/\D/g, '');
    if (!normalizedNumber.startsWith('880')) {
      normalizedNumber = '880' + normalizedNumber.slice(-10);
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: normalizedNumber,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'en'
        },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: booking.name },
              { type: 'text', text: `BK-${String(booking.id).padStart(4, '0')}` },
              { type: 'text', text: booking.vehicle_make + ' ' + booking.vehicle_model },
              { type: 'text', text: booking.service_type },
              { type: 'text', text: booking.preferred_date },
              { type: 'text', text: booking.preferred_time }
            ]
          }
        ]
      }
    };

    const response = await fetch(
      `https://graph.instagram.com/v18.0/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Meta WhatsApp API error: ${error}`);
    }

    const data = (await response.json()) as { messages: Array<{ id: string }> };
    return data;
  }
}
