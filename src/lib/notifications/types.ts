// Shared types for multi-channel notification system

import type { Booking } from '../booking-db';

export type NotificationType = 'confirmation' | 'cancellation';
export type NotificationChannel = 'email' | 'sms' | 'whatsapp';
export type NotificationStatus = 'sent' | 'failed' | 'skipped' | 'mock';
export type NotificationMode = 'production' | 'development' | 'mock';

export interface NotificationResult {
  channel: NotificationChannel;
  status: NotificationStatus;
  message?: string;
  error?: string;
}

export interface NotificationRequest {
  booking: Booking;
  type: NotificationType;
  mode: NotificationMode;
}

export interface NotificationResponse {
  success: boolean;
  bookingStatus: string;
  notifications: {
    email: NotificationStatus;
    sms: NotificationStatus;
    whatsapp: NotificationStatus;
  };
  errors?: {
    email?: string;
    sms?: string;
    whatsapp?: string;
  };
}

export interface NotificationProvider {
  send(request: NotificationRequest): Promise<NotificationResult>;
}

export interface EmailBindingType {
  send(message: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<{ id: string }>;
}

export interface ProviderEnvironment {
  EMAIL?: EmailBindingType;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_PHONE_NUMBER?: string;
  WHATSAPP_BUSINESS_ACCOUNT_ID?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_API_ACCESS_TOKEN?: string;
  NOTIFICATION_MODE?: NotificationMode;
}
