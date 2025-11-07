/**
 * Validation utilities for input validation
 * These functions ensure data integrity before calling Google APIs
 */

import { ValidationError } from '../types.js';

/**
 * Validates an email address format
 * @param email - Email address to validate
 * @returns true if valid
 * @throws ValidationError if invalid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new ValidationError(`Invalid email address: ${email}`, 'email');
  }
  return true;
}

/**
 * Validates multiple comma-separated email addresses
 * @param emails - Comma-separated email addresses
 * @returns true if all valid
 * @throws ValidationError if any invalid
 */
export function validateEmails(emails: string): boolean {
  if (!emails || emails.trim() === '') {
    return true; // Empty is ok for optional fields
  }

  const emailList = emails.split(',').map(e => e.trim());
  for (const email of emailList) {
    validateEmail(email);
  }
  return true;
}

/**
 * Validates an ISO 8601 date/time string
 * @param dateString - Date string to validate
 * @param fieldName - Name of the field for error messages
 * @returns true if valid
 * @throws ValidationError if invalid
 */
export function validateISODate(dateString: string, fieldName: string = 'date'): boolean {
  if (!dateString) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }

  const date = Date.parse(dateString);
  if (isNaN(date)) {
    throw new ValidationError(
      `Invalid ISO 8601 date format for ${fieldName}: ${dateString}. Expected format: YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DDTHH:mm:ss+00:00`,
      fieldName
    );
  }

  return true;
}

/**
 * Validates a timezone string (IANA timezone database format)
 * @param timezone - Timezone to validate (e.g., "America/New_York", "UTC")
 * @returns true if valid
 * @throws ValidationError if invalid
 */
export function validateTimezone(timezone: string): boolean {
  if (!timezone) {
    return true; // Optional field
  }

  // Basic validation - check if it's a valid format
  // Full validation would require a timezone database
  const timezoneRegex = /^[A-Za-z_]+\/[A-Za-z_]+$|^UTC$|^GMT[+-]?\d{0,2}$/;
  if (!timezoneRegex.test(timezone)) {
    throw new ValidationError(
      `Invalid timezone format: ${timezone}. Expected IANA timezone (e.g., "America/New_York") or "UTC"`,
      'timezone'
    );
  }

  return true;
}

/**
 * Validates that a string is not empty
 * @param value - String to validate
 * @param fieldName - Name of the field for error messages
 * @returns true if valid
 * @throws ValidationError if invalid
 */
export function validateRequired(value: string | undefined, fieldName: string): boolean {
  if (!value || value.trim() === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
  return true;
}

/**
 * Validates a MIME type format
 * @param mimeType - MIME type to validate
 * @returns true if valid
 * @throws ValidationError if invalid
 */
export function validateMimeType(mimeType: string): boolean {
  if (!mimeType) {
    return true; // Optional field
  }

  const mimeTypeRegex = /^[a-z]+\/[a-z0-9\-\+\.]+$/i;
  if (!mimeTypeRegex.test(mimeType)) {
    throw new ValidationError(
      `Invalid MIME type format: ${mimeType}. Expected format: type/subtype (e.g., "text/plain", "application/json")`,
      'mimeType'
    );
  }

  return true;
}

/**
 * Validates that end time is after start time
 * @param startTime - Start time in ISO 8601 format
 * @param endTime - End time in ISO 8601 format
 * @returns true if valid
 * @throws ValidationError if invalid
 */
export function validateTimeRange(startTime: string, endTime: string): boolean {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (end <= start) {
    throw new ValidationError(
      `End time (${endTime}) must be after start time (${startTime})`,
      'timeRange'
    );
  }

  return true;
}

/**
 * Validates a file ID format (Google Drive/Calendar)
 * @param id - ID to validate
 * @param fieldName - Name of the field for error messages
 * @returns true if valid
 * @throws ValidationError if invalid
 */
export function validateId(id: string, fieldName: string = 'id'): boolean {
  if (!id || id.trim() === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }

  // Google IDs are typically alphanumeric with some special chars
  const idRegex = /^[a-zA-Z0-9\-_]+$/;
  if (!idRegex.test(id)) {
    throw new ValidationError(
      `Invalid ${fieldName} format: ${id}. Expected alphanumeric characters, hyphens, and underscores only`,
      fieldName
    );
  }

  return true;
}
