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
// Gemini AI Types
// ============================================================================

export interface GeminiGenerateParams {
  prompt: string;
  model?: string;          // default: "gemini-2.0-flash-exp"
  temperature?: number;    // 0-2, default: 1
  maxTokens?: number;
}

export interface GeminiChatParams {
  messages: Array<{
    role: 'user' | 'model';
    content: string;
  }>;
  model?: string;
  temperature?: number;
}

export interface GeminiVisionParams {
  prompt: string;
  imageUrl?: string;
  imageData?: string;      // base64 encoded image
  model?: string;
}

// ============================================================================
// Cloud Vision API Types
// ============================================================================

export interface VisionAnalyzeParams {
  imageUrl?: string;
  imageData?: string;      // base64 encoded
  features?: string[];     // e.g., ["TEXT_DETECTION", "LABEL_DETECTION"]
}

export interface VisionOCRParams {
  imageUrl?: string;
  imageData?: string;
  languageHints?: string[];
}

export interface VisionLabelParams {
  imageUrl?: string;
  imageData?: string;
  maxResults?: number;
}

// ============================================================================
// Cloud Translation API Types
// ============================================================================

export interface TranslateTextParams {
  text: string | string[];
  targetLanguage: string;  // ISO 639-1 code (e.g., "en", "es", "he")
  sourceLanguage?: string; // Auto-detect if not specified
}

export interface DetectLanguageParams {
  text: string | string[];
}

export interface ListLanguagesParams {
  displayLanguageCode?: string;
}

// ============================================================================
// Imagen 3 API Types (Image Generation)
// ============================================================================

export interface ImagenGenerateParams {
  prompt: string;              // Description of the image to generate
  negativePrompt?: string;     // What to avoid in the image
  aspectRatio?: string;        // "1:1", "9:16", "16:9", "4:3", "3:4" (default: "1:1")
  numberOfImages?: number;     // 1-4 images (default: 1)
  model?: string;              // "imagen-3.0-generate-001" or "imagen-3.0-fast-generate-001"
  safetyFilterLevel?: string;  // "block_most", "block_some", "block_few" (default: "block_some")
  personGeneration?: string;   // "allow_adult", "allow_all", "dont_allow" (default: "dont_allow")
}

export interface ImagenEditParams {
  prompt: string;
  baseImage: string;           // base64 encoded image to edit
  mask?: string;               // base64 encoded mask (optional)
  negativePrompt?: string;
  numberOfImages?: number;
}

// ============================================================================
// Veo API Types (Video Generation)
// ============================================================================

export interface VeoGenerateParams {
  prompt: string;              // Description of the video to generate
  duration?: number;           // Duration in seconds (default: 5)
  aspectRatio?: string;        // "16:9", "9:16", "1:1"
  model?: string;              // "veo-3.0" or specific model version
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
