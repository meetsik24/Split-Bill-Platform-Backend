import axios from 'axios';
import { env } from '../config/env';

export interface SMSMessage {
  to: string;
  message: string;
}

export interface SMSSendResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SMSService {
  private readonly apiKey: string;
  private readonly senderId: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = env.BRIQ_API_KEY;
    this.senderId = env.BRIQ_SENDER_ID;
    this.baseUrl = 'https://api.briq.tz/v1';
  }

  /**
   * Send SMS via Briq API
   */
  async sendSMS(message: SMSMessage): Promise<SMSSendResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/sms/send`,
        {
          to: message.to,
          message: message.message,
          sender_id: this.senderId,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        return {
          success: true,
          messageId: response.data.message_id,
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Failed to send SMS',
        };
      }
    } catch (error) {
      console.error('SMS sending failed:', error);
      
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || error.message || 'Network error',
        };
      }
      
      return {
        success: false,
        error: 'Unknown error occurred',
      };
    }
  }

  /**
   * Send bill split request SMS
   */
  async sendBillSplitRequest(phone: string, amount: number, organizerName: string): Promise<SMSSendResponse> {
    const message = `Hi! ${organizerName} has requested you to split a bill of ${amount.toFixed(2)} TZS. Please pay your share. Reply with PAY to confirm.`;
    return this.sendSMS({ to: phone, message });
  }

  /**
   * Send payment update SMS
   */
  async sendPaymentUpdate(phone: string, paidCount: number, totalCount: number, billAmount: number): Promise<SMSSendResponse> {
    const message = `${paidCount}/${totalCount} friends have paid. Total bill: ${billAmount.toFixed(2)} TZS. Keep up the good work!`;
    return this.sendSMS({ to: phone, message });
  }

  /**
   * Send payment completion SMS to organizer
   */
  async sendPaymentCompletion(phone: string, billAmount: number): Promise<SMSSendResponse> {
    const message = `🎉 Great news! All payments for your bill of ${billAmount.toFixed(2)} TZS have been completed. Thank you for using Split-Bill!`;
    return this.sendSMS({ to: phone, message });
  }

  /**
   * Send payment confirmation SMS
   */
  async sendPaymentConfirmation(phone: string, amount: number): Promise<SMSSendResponse> {
    const message = `✅ Payment confirmed! You've paid ${amount.toFixed(2)} TZS. Thank you for settling your share.`;
    return this.sendSMS({ to: phone, message });
  }
}

export const smsService = new SMSService();
