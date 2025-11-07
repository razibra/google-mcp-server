import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleAuthManager } from "./auth/googleAuth.js";
import { GmailService } from "./services/gmail.js";
import { DriveService } from "./services/drive.js";
import { CalendarService } from "./services/calendar.js";
import { SheetsService } from "./services/sheets.js";
import { TasksService } from "./services/tasks.js";
import { GeminiService } from "./services/gemini.js";
import { VisionService } from "./services/vision.js";
import { TranslationService } from "./services/translation.js";
import { ImagenService } from "./services/imagen.js";
import { VeoService } from "./services/veo.js";
import dotenv from "dotenv";

dotenv.config();

class GoogleMCPServer {
  private server: Server;
  private authManager: GoogleAuthManager;
  private gmailService: GmailService;
  private driveService: DriveService;
  private calendarService: CalendarService;
  private sheetsService: SheetsService;
  private tasksService: TasksService;
  private geminiService: GeminiService;
  private visionService: VisionService;
  private translationService: TranslationService;
  private imagenService: ImagenService;
  private veoService: VeoService;

  constructor() {
    this.server = new Server(
      {
        name: "google-mcp-server",
        version: "4.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.authManager = new GoogleAuthManager();
    this.gmailService = new GmailService();
    this.driveService = new DriveService();
    this.calendarService = new CalendarService();
    this.sheetsService = new SheetsService();
    this.tasksService = new TasksService();
    this.geminiService = new GeminiService();
    this.visionService = new VisionService();
    this.translationService = new TranslationService();
    this.imagenService = new ImagenService();
    this.veoService = new VeoService();

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // ====================================================================
        // Gmail Tools
        // ====================================================================
        {
          name: "gmail_send",
          description: "Send an email via Gmail",
          inputSchema: {
            type: "object",
            properties: {
              to: { type: "string", description: "Recipient email address (required)" },
              subject: { type: "string", description: "Email subject (required)" },
              body: { type: "string", description: "Email body (required)" },
              cc: { type: "string", description: "CC recipients (comma-separated)" },
              bcc: { type: "string", description: "BCC recipients (comma-separated)" },
              isHtml: { type: "boolean", description: "Whether body is HTML", default: false },
            },
            required: ["to", "subject", "body"],
          },
        },
        {
          name: "gmail_list",
          description: "List emails from Gmail inbox",
          inputSchema: {
            type: "object",
            properties: {
              maxResults: { type: "number", description: "Maximum number of emails (default: 10)" },
              query: { type: "string", description: "Gmail search query (e.g., 'is:unread from:example@gmail.com')" },
              labelIds: { type: "string", description: "Comma-separated label IDs (e.g., 'INBOX,UNREAD')" },
            },
          },
        },
        {
          name: "gmail_read",
          description: "Read a specific email by ID",
          inputSchema: {
            type: "object",
            properties: {
              messageId: { type: "string", description: "Gmail message ID (required)" },
              format: { type: "string", enum: ["full", "metadata", "minimal"], description: "Response format (default: full)" },
            },
            required: ["messageId"],
          },
        },
        {
          name: "gmail_search",
          description: "Search emails using Gmail query syntax",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Gmail search query (required)" },
              maxResults: { type: "number", description: "Maximum results (default: 10)" },
            },
            required: ["query"],
          },
        },
        {
          name: "gmail_modify_labels",
          description: "Add or remove labels from an email",
          inputSchema: {
            type: "object",
            properties: {
              messageId: { type: "string", description: "Gmail message ID (required)" },
              addLabelIds: { type: "string", description: "Comma-separated label IDs to add" },
              removeLabelIds: { type: "string", description: "Comma-separated label IDs to remove" },
            },
            required: ["messageId"],
          },
        },
        {
          name: "gmail_list_labels",
          description: "List all available Gmail labels",
          inputSchema: { type: "object", properties: {} },
        },

        // ====================================================================
        // Drive Tools
        // ====================================================================
        {
          name: "drive_upload",
          description: "Upload a file to Google Drive",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Name of the file (required)" },
              content: { type: "string", description: "File content (required)" },
              mimeType: { type: "string", description: "MIME type (default: text/plain)" },
              folderId: { type: "string", description: "Parent folder ID" },
            },
            required: ["name", "content"],
          },
        },
        {
          name: "drive_list",
          description: "List files in Google Drive",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Drive query (e.g., \"name contains 'report'\")" },
              pageSize: { type: "number", description: "Number of results (default: 10)" },
            },
          },
        },
        {
          name: "drive_read",
          description: "Read file content from Google Drive",
          inputSchema: {
            type: "object",
            properties: {
              fileId: { type: "string", description: "File ID (required)" },
            },
            required: ["fileId"],
          },
        },
        {
          name: "drive_download",
          description: "Download/export file from Drive (supports Google Workspace files)",
          inputSchema: {
            type: "object",
            properties: {
              fileId: { type: "string", description: "File ID (required)" },
              mimeType: { type: "string", description: "Export MIME type for Google Workspace files" },
            },
            required: ["fileId"],
          },
        },
        {
          name: "drive_search",
          description: "Search files in Google Drive",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query (required)" },
              maxResults: { type: "number", description: "Maximum results (default: 10)" },
            },
            required: ["query"],
          },
        },
        {
          name: "drive_delete",
          description: "Delete a file from Google Drive",
          inputSchema: {
            type: "object",
            properties: {
              fileId: { type: "string", description: "File ID (required)" },
            },
            required: ["fileId"],
          },
        },

        // ====================================================================
        // Calendar Tools
        // ====================================================================
        {
          name: "calendar_create_event",
          description: "Create a new calendar event",
          inputSchema: {
            type: "object",
            properties: {
              summary: { type: "string", description: "Event title (required)" },
              startTime: { type: "string", description: "Start time ISO 8601 (required)" },
              endTime: { type: "string", description: "End time ISO 8601 (required)" },
              description: { type: "string", description: "Event description" },
              location: { type: "string", description: "Event location" },
              attendees: { type: "string", description: "Comma-separated email addresses" },
              timezone: { type: "string", description: "IANA timezone (default: UTC)" },
            },
            required: ["summary", "startTime", "endTime"],
          },
        },
        {
          name: "calendar_list_events",
          description: "List calendar events",
          inputSchema: {
            type: "object",
            properties: {
              maxResults: { type: "number", description: "Maximum results (default: 10)" },
              timeMin: { type: "string", description: "Start of time range (ISO 8601)" },
              timeMax: { type: "string", description: "End of time range (ISO 8601)" },
              timezone: { type: "string", description: "IANA timezone for results" },
            },
          },
        },
        {
          name: "calendar_update_event",
          description: "Update an existing calendar event",
          inputSchema: {
            type: "object",
            properties: {
              eventId: { type: "string", description: "Event ID (required)" },
              summary: { type: "string", description: "New title" },
              description: { type: "string", description: "New description" },
              startTime: { type: "string", description: "New start time (ISO 8601)" },
              endTime: { type: "string", description: "New end time (ISO 8601)" },
              location: { type: "string", description: "New location" },
              attendees: { type: "string", description: "Comma-separated emails" },
              timezone: { type: "string", description: "IANA timezone" },
            },
            required: ["eventId"],
          },
        },

        // ====================================================================
        // Sheets Tools
        // ====================================================================
        {
          name: "sheets_create",
          description: "Create a new Google Spreadsheet",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string", description: "Spreadsheet title (required)" },
              sheetTitles: { type: "array", items: { type: "string" }, description: "Sheet names" },
            },
            required: ["title"],
          },
        },
        {
          name: "sheets_read",
          description: "Read data from a Google Sheet",
          inputSchema: {
            type: "object",
            properties: {
              spreadsheetId: { type: "string", description: "Spreadsheet ID (required)" },
              range: { type: "string", description: "A1 notation range (e.g., 'Sheet1!A1:D10') (required)" },
            },
            required: ["spreadsheetId", "range"],
          },
        },
        {
          name: "sheets_write",
          description: "Write data to a Google Sheet",
          inputSchema: {
            type: "object",
            properties: {
              spreadsheetId: { type: "string", description: "Spreadsheet ID (required)" },
              range: { type: "string", description: "A1 notation range (required)" },
              values: { type: "array", items: { type: "array" }, description: "2D array of values (required)" },
            },
            required: ["spreadsheetId", "range", "values"],
          },
        },
        {
          name: "sheets_append",
          description: "Append data to a Google Sheet",
          inputSchema: {
            type: "object",
            properties: {
              spreadsheetId: { type: "string", description: "Spreadsheet ID (required)" },
              range: { type: "string", description: "A1 notation range (required)" },
              values: { type: "array", items: { type: "array" }, description: "2D array of values (required)" },
            },
            required: ["spreadsheetId", "range", "values"],
          },
        },

        // ====================================================================
        // Tasks Tools
        // ====================================================================
        {
          name: "tasks_create",
          description: "Create a new task in Google Tasks",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string", description: "Task title (required)" },
              notes: { type: "string", description: "Task notes/description" },
              due: { type: "string", description: "Due date (ISO 8601)" },
              taskListId: { type: "string", description: "Task list ID (default: @default)" },
            },
            required: ["title"],
          },
        },
        {
          name: "tasks_list",
          description: "List tasks from Google Tasks",
          inputSchema: {
            type: "object",
            properties: {
              taskListId: { type: "string", description: "Task list ID (default: @default)" },
              maxResults: { type: "number", description: "Maximum results (default: 20)" },
              showCompleted: { type: "boolean", description: "Show completed tasks" },
            },
          },
        },
        {
          name: "tasks_update",
          description: "Update an existing task",
          inputSchema: {
            type: "object",
            properties: {
              taskId: { type: "string", description: "Task ID (required)" },
              taskListId: { type: "string", description: "Task list ID (default: @default)" },
              title: { type: "string", description: "New title" },
              notes: { type: "string", description: "New notes" },
              due: { type: "string", description: "New due date (ISO 8601)" },
              status: { type: "string", enum: ["needsAction", "completed"], description: "Task status" },
            },
            required: ["taskId"],
          },
        },
        {
          name: "tasks_delete",
          description: "Delete a task",
          inputSchema: {
            type: "object",
            properties: {
              taskId: { type: "string", description: "Task ID (required)" },
              taskListId: { type: "string", description: "Task list ID (default: @default)" },
            },
            required: ["taskId"],
          },
        },
        {
          name: "tasks_list_lists",
          description: "List all task lists",
          inputSchema: { type: "object", properties: {} },
        },

        // ====================================================================
        // Auth Tool
        // ====================================================================
        {
          name: "auth_status",
          description: "Check authentication status",
          inputSchema: { type: "object", properties: {} },
        },

        // ====================================================================
        // Gemini AI Tools
        // ====================================================================
        {
          name: "gemini_generate",
          description: "Generate text using Gemini 2.5 AI (Google's most advanced model)",
          inputSchema: {
            type: "object",
            properties: {
              prompt: { type: "string", description: "Text prompt for generation (required)" },
              model: { type: "string", description: "Model to use (default: gemini-2.5-pro-latest, options: gemini-2.5-flash-latest, gemini-2.0-flash-exp)" },
              temperature: { type: "number", description: "Temperature 0-2 (default: 1)" },
              maxTokens: { type: "number", description: "Maximum tokens to generate" },
            },
            required: ["prompt"],
          },
        },
        {
          name: "gemini_chat",
          description: "Have a conversation with Gemini 2.5 AI",
          inputSchema: {
            type: "object",
            properties: {
              messages: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    role: { type: "string", enum: ["user", "model"] },
                    content: { type: "string" },
                  },
                },
                description: "Conversation history (required)",
              },
              model: { type: "string", description: "Model to use (default: gemini-2.5-pro-latest)" },
              temperature: { type: "number", description: "Temperature 0-2 (default: 1)" },
            },
            required: ["messages"],
          },
        },
        {
          name: "gemini_vision",
          description: "Analyze images with Gemini 2.5 vision capabilities",
          inputSchema: {
            type: "object",
            properties: {
              prompt: { type: "string", description: "Question or instruction about the image (required)" },
              imageUrl: { type: "string", description: "URL of the image to analyze" },
              imageData: { type: "string", description: "Base64-encoded image data" },
              model: { type: "string", description: "Model to use (default: gemini-2.5-pro-latest)" },
            },
            required: ["prompt"],
          },
        },

        // ====================================================================
        // Cloud Vision API Tools
        // ====================================================================
        {
          name: "vision_analyze",
          description: "Analyze an image with Cloud Vision API (comprehensive analysis)",
          inputSchema: {
            type: "object",
            properties: {
              imageUrl: { type: "string", description: "URL of the image" },
              imageData: { type: "string", description: "Base64-encoded image data" },
              features: {
                type: "array",
                items: { type: "string" },
                description: "Features to detect (e.g., TEXT_DETECTION, LABEL_DETECTION, FACE_DETECTION)",
              },
            },
          },
        },
        {
          name: "vision_ocr",
          description: "Extract text from an image using OCR (Optical Character Recognition)",
          inputSchema: {
            type: "object",
            properties: {
              imageUrl: { type: "string", description: "URL of the image" },
              imageData: { type: "string", description: "Base64-encoded image data" },
              languageHints: {
                type: "array",
                items: { type: "string" },
                description: "Language hints (e.g., ['en', 'he', 'ar'])",
              },
            },
          },
        },
        {
          name: "vision_labels",
          description: "Detect objects, scenes, and concepts in an image",
          inputSchema: {
            type: "object",
            properties: {
              imageUrl: { type: "string", description: "URL of the image" },
              imageData: { type: "string", description: "Base64-encoded image data" },
              maxResults: { type: "number", description: "Maximum number of labels (default: 10)" },
            },
          },
        },

        // ====================================================================
        // Cloud Translation API Tools
        // ====================================================================
        {
          name: "translate",
          description: "Translate text to another language",
          inputSchema: {
            type: "object",
            properties: {
              text: {
                type: ["string", "array"],
                description: "Text to translate (string or array of strings) (required)",
              },
              targetLanguage: { type: "string", description: "Target language ISO code (e.g., 'en', 'es', 'he') (required)" },
              sourceLanguage: { type: "string", description: "Source language (auto-detected if not specified)" },
            },
            required: ["text", "targetLanguage"],
          },
        },
        {
          name: "detect_language",
          description: "Detect the language of text",
          inputSchema: {
            type: "object",
            properties: {
              text: {
                type: ["string", "array"],
                description: "Text to analyze (string or array of strings) (required)",
              },
            },
            required: ["text"],
          },
        },
        {
          name: "list_languages",
          description: "List all supported translation languages",
          inputSchema: {
            type: "object",
            properties: {
              displayLanguageCode: { type: "string", description: "Language for display names (e.g., 'en', 'he')" },
            },
          },
        },

        // ====================================================================
        // Imagen 3 Tools (Image Generation)
        // ====================================================================
        {
          name: "imagen_generate",
          description: "Generate images from text using Imagen 3 (Google's advanced text-to-image AI)",
          inputSchema: {
            type: "object",
            properties: {
              prompt: { type: "string", description: "Description of the image to generate (required)" },
              negativePrompt: { type: "string", description: "What to avoid in the image" },
              aspectRatio: {
                type: "string",
                enum: ["1:1", "9:16", "16:9", "4:3", "3:4"],
                description: "Aspect ratio (default: 1:1)"
              },
              numberOfImages: { type: "number", description: "Number of images to generate (1-4, default: 1)" },
              model: {
                type: "string",
                enum: ["imagen-3.0-generate-001", "imagen-3.0-fast-generate-001"],
                description: "Model to use (default: imagen-3.0-generate-001)"
              },
              safetyFilterLevel: {
                type: "string",
                enum: ["block_most", "block_some", "block_few"],
                description: "Safety filter level (default: block_some)"
              },
              personGeneration: {
                type: "string",
                enum: ["allow_adult", "allow_all", "dont_allow"],
                description: "Person generation policy (default: dont_allow)"
              },
            },
            required: ["prompt"],
          },
        },
        {
          name: "imagen_edit",
          description: "Edit images using Imagen 3 (inpainting/outpainting)",
          inputSchema: {
            type: "object",
            properties: {
              prompt: { type: "string", description: "Description of how to edit the image (required)" },
              baseImage: { type: "string", description: "Base64-encoded image to edit (required)" },
              mask: { type: "string", description: "Base64-encoded mask for inpainting (optional)" },
              negativePrompt: { type: "string", description: "What to avoid in the edited image" },
              numberOfImages: { type: "number", description: "Number of edited versions (1-4, default: 1)" },
            },
            required: ["prompt", "baseImage"],
          },
        },

        // ====================================================================
        // Veo 3 Tools (Video Generation)
        // ====================================================================
        {
          name: "veo_generate",
          description: "Generate videos from text using Veo 3 (Google's video generation AI) - Note: May require special access",
          inputSchema: {
            type: "object",
            properties: {
              prompt: { type: "string", description: "Description of the video to generate (required)" },
              duration: { type: "number", description: "Duration in seconds (1-30, default: 5)" },
              aspectRatio: {
                type: "string",
                enum: ["16:9", "9:16", "1:1"],
                description: "Aspect ratio (default: 16:9)"
              },
              model: { type: "string", description: "Model version (default: veo-3.0)" },
            },
            required: ["prompt"],
          },
        },
        {
          name: "veo_check_availability",
          description: "Check if Veo 3 API is available and accessible",
          inputSchema: { type: "object", properties: {} },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const auth = await this.authManager.getAuthClient();

        switch (name) {
          // Gmail handlers
          case "gmail_send":
            return await this.gmailService.sendEmail(auth, args as any);
          case "gmail_list":
            return await this.gmailService.listEmails(auth, args as any);
          case "gmail_read":
            return await this.gmailService.readEmail(auth, args as any);
          case "gmail_search":
            return await this.gmailService.searchEmails(auth, args as any);
          case "gmail_modify_labels":
            return await this.gmailService.modifyEmailLabels(auth, args as any);
          case "gmail_list_labels":
            return await this.gmailService.listLabels(auth);

          // Drive handlers
          case "drive_upload":
            return await this.driveService.uploadFile(auth, args as any);
          case "drive_list":
            return await this.driveService.listFiles(auth, args as any);
          case "drive_read":
            return await this.driveService.readFile(auth, args as any);
          case "drive_download":
            return await this.driveService.downloadFile(auth, args as any);
          case "drive_search":
            return await this.driveService.searchFiles(auth, args as any);
          case "drive_delete":
            return await this.driveService.deleteFile(auth, args as any);

          // Calendar handlers
          case "calendar_create_event":
            return await this.calendarService.createEvent(auth, args as any);
          case "calendar_list_events":
            return await this.calendarService.listEvents(auth, args as any);
          case "calendar_update_event":
            return await this.calendarService.updateEvent(auth, args as any);

          // Sheets handlers
          case "sheets_create":
            return await this.sheetsService.createSpreadsheet(auth, args as any);
          case "sheets_read":
            return await this.sheetsService.readSheet(auth, args as any);
          case "sheets_write":
            return await this.sheetsService.writeSheet(auth, args as any);
          case "sheets_append":
            return await this.sheetsService.appendSheet(auth, args as any);

          // Tasks handlers
          case "tasks_create":
            return await this.tasksService.createTask(auth, args as any);
          case "tasks_list":
            return await this.tasksService.listTasks(auth, args as any);
          case "tasks_update":
            return await this.tasksService.updateTask(auth, args as any);
          case "tasks_delete":
            return await this.tasksService.deleteTask(auth, args as any);
          case "tasks_list_lists":
            return await this.tasksService.listTaskLists(auth);

          // Gemini AI handlers
          case "gemini_generate":
            return await this.geminiService.generate(auth, args as any);
          case "gemini_chat":
            return await this.geminiService.chat(auth, args as any);
          case "gemini_vision":
            return await this.geminiService.vision(auth, args as any);

          // Cloud Vision handlers
          case "vision_analyze":
            return await this.visionService.analyze(auth, args as any);
          case "vision_ocr":
            return await this.visionService.ocr(auth, args as any);
          case "vision_labels":
            return await this.visionService.detectLabels(auth, args as any);

          // Cloud Translation handlers
          case "translate":
            return await this.translationService.translate(auth, args as any);
          case "detect_language":
            return await this.translationService.detectLanguage(auth, args as any);
          case "list_languages":
            return await this.translationService.listLanguages(auth, args as any);

          // Imagen handlers
          case "imagen_generate":
            return await this.imagenService.generate(auth, args as any);
          case "imagen_edit":
            return await this.imagenService.edit(auth, args as any);

          // Veo handlers
          case "veo_generate":
            return await this.veoService.generate(auth, args as any);
          case "veo_check_availability":
            return await this.veoService.checkAvailability(auth);

          // Auth status
          case "auth_status":
            return {
              content: [{
                type: "text",
                text: `Authentication status: ${(await this.authManager.isAuthenticated()) ? "Authenticated" : "Not authenticated"}`,
              }],
            };

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: unknown) {
        return {
          content: [{
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Google MCP Server running on stdio");
  }
}

const server = new GoogleMCPServer();
server.run().catch(console.error);
