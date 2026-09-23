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
    return {
      channel: 'whatsapp',
      status: 'disabled',
      message: 'WhatsApp notifications are currently disabled'
    };
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
