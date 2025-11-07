/**
 * Type definitions for Google MCP Server
 * This file contains all the interfaces and types used throughout the application
 */

// ============================================================================
// Gmail Types
// ============================================================================

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  isHtml?: boolean;
}

// ============================================================================
// Google Drive Types
// ============================================================================

export interface UploadFileParams {
  name: string;
  content: string;
  mimeType?: string;
  folderId?: string;
}

export interface ListFilesParams {
  query?: string;
  pageSize?: number;
}

export interface DeleteFileParams {
  fileId: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
}

// ============================================================================
// Google Calendar Types
// ============================================================================

export interface CreateEventParams {
  summary: string;
  description?: string;
  startTime: string;  // ISO 8601 format
  endTime: string;    // ISO 8601 format
  location?: string;
  attendees?: string; // Comma-separated email addresses
  timezone?: string;  // IANA timezone (e.g., "America/New_York")
}

export interface ListEventsParams {
  maxResults?: number;
  timeMin?: string;   // ISO 8601 format
  timeMax?: string;   // ISO 8601 format
  timezone?: string;
}

export interface UpdateEventParams {
  eventId: string;
  summary?: string;
  description?: string;
  startTime?: string;  // ISO 8601 format
  endTime?: string;    // ISO 8601 format
  location?: string;
  attendees?: string;
  timezone?: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start?: {
    dateTime?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{ email: string }>;
  htmlLink?: string;
}

// ============================================================================
// Validation Error Types
// ============================================================================

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class GoogleAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public apiError?: unknown
  ) {
    super(message);
    this.name = 'GoogleAPIError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}
