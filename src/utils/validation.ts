import { z } from 'zod';

/**
 * Validate phone number format (Tanzanian format)
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove any spaces or special characters
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Tanzanian phone number patterns:
  // +2557XXXXXXXX, +2556XXXXXXXX, 07XXXXXXXX, 06XXXXXXXX
  const phoneRegex = /^(\+255|0)?[67]\d{8}$/;
  
  return phoneRegex.test(cleanPhone);
}

/**
 * Format phone number to international format
 */
export function formatPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleanPhone.startsWith('0')) {
    return '+255' + cleanPhone.substring(1);
  }
  
  if (cleanPhone.startsWith('+255')) {
    return cleanPhone;
  }
  
  if (cleanPhone.startsWith('255')) {
    return '+' + cleanPhone;
  }
  
  // Assume it's a local number starting with 7 or 6
  if (/^[67]\d{8}$/.test(cleanPhone)) {
    return '+255' + cleanPhone;
  }
  
  return cleanPhone;
}

/**
 * Validate amount (positive number with up to 2 decimal places)
 */
export function validateAmount(amount: number): boolean {
  return amount > 0 && Number.isFinite(amount) && 
         amount.toString().split('.')[1]?.length <= 2;
}

/**
 * Round amount to 2 decimal places
 */
export function roundAmount(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Calculate amount per person for bill splitting
 */
export function calculateAmountPerPerson(totalAmount: number, numberOfPeople: number): number {
  if (numberOfPeople <= 0) {
    throw new Error('Number of people must be positive');
  }
  
  const amountPerPerson = totalAmount / numberOfPeople;
  return roundAmount(amountPerPerson);
}

/**
 * Validate bill description length
 */
export function validateDescription(description: string): boolean {
  return description.length <= 500; // Max 500 characters
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, ''); // Basic XSS prevention
}

/**
 * Generate bill reference number
 */
export function generateBillReference(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `BILL-${timestamp}-${random}`.toUpperCase();
}

/**
 * Validate session ID format
 */
export function validateSessionId(sessionId: string): boolean {
  // Session ID should be alphanumeric and reasonable length
  return /^[a-zA-Z0-9]{8,32}$/.test(sessionId);
}

/**
 * Phone number validation schema for Zod
 */
export const phoneNumberSchema = z.string()
  .min(1, 'Phone number is required')
  .refine(validatePhoneNumber, 'Invalid phone number format');

/**
 * Amount validation schema for Zod
 */
export const amountSchema = z.number()
  .positive('Amount must be positive')
  .refine(validateAmount, 'Invalid amount format');

/**
 * Description validation schema for Zod
 */
export const descriptionSchema = z.string()
  .max(500, 'Description too long')
  .optional();
