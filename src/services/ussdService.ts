import { billService, type CreateBillRequest } from './billService';

export interface USSDRequest {
  sessionId: string;
  serviceCode: string;
  phoneNumber: string;
  text: string;
}

export interface USSDResponse {
  sessionId: string;
  serviceCode: string;
  message: string;
  status: 'CON' | 'END';
}

export interface USSDState {
  step: 'amount' | 'members' | 'confirm';
  amount?: number;
  memberPhones: string[];
  creatorName?: string;
  phoneNumber?: string;
}

// In-memory session storage (in production, use Redis)
const sessionStore = new Map<string, USSDState>();

export class USSDService {
  /**
   * Process USSD request and return appropriate response
   * Based on Africa's Talking USSD API specification
   */
  async processUSSDRequest(request: USSDRequest): Promise<USSDResponse> {
    const { sessionId, phoneNumber } = request;
    
    // Get or create session state
    let state = sessionStore.get(sessionId) || {
      step: 'amount',
      memberPhones: [],
      phoneNumber: phoneNumber,
    };

    try {
      switch (state.step) {
        case 'amount':
          return this.handleAmountStep(request, state);
        
        case 'members':
          return this.handleMembersStep(request, state);
        
        case 'confirm':
          return this.handleConfirmStep(request, state);
        
        default:
          return this.createResponse(request.sessionId, 'Invalid session state', 'END');
      }
    } catch (error) {
      console.error('USSD processing error:', error);
      return this.createResponse(
        request.sessionId,
        'An error occurred. Please try again.',
        'END'
      );
    }
  }

  /**
   * Handle amount input step
   */
  private handleAmountStep(request: USSDRequest, state: USSDState): USSDResponse {
    const { sessionId, text, phoneNumber } = request;
    
    if (!text || text.trim() === '') {
      // First time - ask for amount
      state.creatorName = this.extractNameFromPhone(phoneNumber);
      state.phoneNumber = phoneNumber;
      sessionStore.set(sessionId, state);
      
      return this.createResponse(
        sessionId,
        `Welcome ${state.creatorName || 'User'}!\n\nEnter the total bill amount:`,
        'CON'
      );
    }

    // Parse amount
    const amount = parseFloat(text.trim());
    if (isNaN(amount) || amount <= 0) {
      return this.createResponse(
        sessionId,
        'Invalid amount. Please enter a valid number greater than 0:',
        'CON'
      );
    }

    // Store amount and move to next step
    state.amount = amount;
    state.step = 'members';
    sessionStore.set(sessionId, state);

    return this.createResponse(
      sessionId,
      `Bill amount: ${amount.toFixed(2)} TZS\n\nEnter phone numbers separated by commas (e.g., 0712345678,0756789012):`,
      'CON'
    );
  }

  /**
   * Handle members input step
   */
  private handleMembersStep(request: USSDRequest, state: USSDState): USSDResponse {
    const { sessionId, text } = request;
    
    if (!text || text.trim() === '') {
      return this.createResponse(
        sessionId,
        'Please enter phone numbers separated by commas:',
        'CON'
      );
    }

    // Parse phone numbers
    const phoneNumbers = text
      .split(',')
      .map(phone => phone.trim())
      .filter(phone => this.isValidPhoneNumber(phone));

    if (phoneNumbers.length === 0) {
      return this.createResponse(
        sessionId,
        'No valid phone numbers found. Please enter valid phone numbers separated by commas:',
        'CON'
      );
    }

    // Store member phones and move to confirmation
    state.memberPhones = phoneNumbers;
    state.step = 'confirm';
    sessionStore.set(sessionId, state);

    const totalAmount = state.amount!;
    const amountPerPerson = totalAmount / phoneNumbers.length;

    const confirmationMessage = 
      `📋 Bill Summary:\n` +
      `Total Amount: ${totalAmount.toFixed(2)} TZS\n` +
      `Members: ${phoneNumbers.length}\n` +
      `Amount per person: ${amountPerPerson.toFixed(2)} TZS\n\n` +
      `Phone Numbers:\n${phoneNumbers.join('\n')}\n\n` +
      `Reply:\n` +
      `1 - Confirm and Create Bill\n` +
      `2 - Cancel`;

    return this.createResponse(sessionId, confirmationMessage, 'CON');
  }

  /**
   * Handle confirmation step
   */
  private async handleConfirmStep(request: USSDRequest, state: USSDState): Promise<USSDResponse> {
    const { sessionId, text } = request;
    
    if (text === '1') {
      try {
        // Create the bill
        const billRequest: CreateBillRequest = {
          creatorPhone: state.phoneNumber!,
          creatorName: state.creatorName || 'User',
          amount: state.amount!,
          memberPhones: state.memberPhones,
        };

        const bill = await billService.createBill(billRequest);

        // Clear session
        sessionStore.delete(sessionId);

        return this.createResponse(
          sessionId,
          `✅ Bill created successfully!\n\n` +
          `Bill ID: ${bill.id}\n` +
          `Amount: ${bill.amount} TZS\n` +
          `Members: ${bill.members.length}\n\n` +
          `SMS notifications have been sent to all members.`,
          'END'
        );
      } catch (error) {
        console.error('Bill creation failed:', error);
        return this.createResponse(
          sessionId,
          '❌ Failed to create bill. Please try again later.',
          'END'
        );
      }
    } else if (text === '2') {
      // Cancel operation
      sessionStore.delete(sessionId);
      return this.createResponse(
        sessionId,
        '❌ Bill creation cancelled. Thank you for using Split-Bill!',
        'END'
      );
    } else {
      return this.createResponse(
        sessionId,
        'Invalid option. Please reply with:\n1 - Confirm and Create Bill\n2 - Cancel',
        'CON'
      );
    }
  }

  /**
   * Create USSD response in Africa's Talking format
   * Using 'CON' for continue and 'END' for end as per their API spec
   */
  private createResponse(sessionId: string, message: string, status: 'CON' | 'END'): USSDResponse {
    return {
      sessionId,
      serviceCode: '*123#',
      message,
      status,
    };
  }

  /**
   * Extract name from phone number (simplified - in production, you might have a user database)
   */
  private extractNameFromPhone(_phone: string): string {
    // This is a simplified implementation
    // In production, you might want to look up the user's name from a database
    return 'User';
  }

  /**
   * Validate phone number format for Tanzanian numbers
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Basic validation for Tanzanian phone numbers
    // Supports formats: +2557XXXXXXXX, +2556XXXXXXXX, 07XXXXXXXX, 06XXXXXXXX
    const phoneRegex = /^(\+255|0)?[67]\d{8}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Clean up expired sessions (call this periodically)
   */
  cleanupExpiredSessions(): void {
    // In production, implement proper session expiration
    // For now, this is a placeholder
    // You could add timestamp to sessions and clean up old ones
  }

  /**
   * Get session info for debugging
   */
  getSessionInfo(sessionId: string): USSDState | undefined {
    return sessionStore.get(sessionId);
  }

  /**
   * Get total number of active sessions
   */
  getSessionCount(): number {
    return sessionStore.size;
  }

  /**
   * Clear all sessions (useful for testing)
   */
  clearAllSessions(): void {
    sessionStore.clear();
  }
}

export const ussdService = new USSDService();
