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

export interface ListEmailsParams {
  maxResults?: number;
  query?: string;      // Gmail search query format
  labelIds?: string;   // Comma-separated label IDs (e.g., "INBOX,UNREAD")
}

export interface ReadEmailParams {
  messageId: string;
  format?: 'full' | 'metadata' | 'minimal';
}

export interface SearchEmailsParams {
  query: string;       // Gmail search query (e.g., "from:user@example.com subject:hello")
  maxResults?: number;
}

export interface ModifyEmailLabelsParams {
  messageId: string;
  addLabelIds?: string;    // Comma-separated label IDs to add
  removeLabelIds?: string; // Comma-separated label IDs to remove
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
  body?: string;
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

export interface ReadFileParams {
  fileId: string;
}

export interface DownloadFileParams {
  fileId: string;
  mimeType?: string; // For export (e.g., Google Docs to PDF)
}

export interface SearchFilesParams {
  query: string;     // Drive search query
  maxResults?: number;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  content?: string;
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
// Google Sheets Types
// ============================================================================

export interface CreateSpreadsheetParams {
  title: string;
  sheetTitles?: string[]; // Sheet names
}

export interface ReadSheetParams {
  spreadsheetId: string;
  range: string;          // A1 notation (e.g., "Sheet1!A1:D10")
}

export interface WriteSheetParams {
  spreadsheetId: string;
  range: string;          // A1 notation
  values: string[][];     // 2D array of values
}

export interface AppendSheetParams {
  spreadsheetId: string;
  range: string;          // A1 notation
  values: string[][];     // 2D array of values
}

export interface UpdateSheetParams {
  spreadsheetId: string;
  range: string;          // A1 notation
  values: string[][];     // 2D array of values
}

// ============================================================================
// Google Tasks Types
// ============================================================================

export interface CreateTaskParams {
  title: string;
  notes?: string;
  due?: string;           // ISO 8601 format
  taskListId?: string;    // Default: @default
}

export interface ListTasksParams {
  taskListId?: string;    // Default: @default
  maxResults?: number;
  showCompleted?: boolean;
}

export interface UpdateTaskParams {
  taskId: string;
  taskListId?: string;    // Default: @default
  title?: string;
  notes?: string;
  due?: string;           // ISO 8601 format
  status?: 'needsAction' | 'completed';
}

export interface DeleteTaskParams {
  taskId: string;
  taskListId?: string;    // Default: @default
}

export interface TaskItem {
  id: string;
  title: string;
  notes?: string;
  status: string;
  due?: string;
  completed?: string;
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
