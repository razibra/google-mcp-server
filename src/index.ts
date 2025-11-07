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
import dotenv from "dotenv";

dotenv.config();

class GoogleMCPServer {
  private server: Server;
  private authManager: GoogleAuthManager;
  private gmailService: GmailService;
  private driveService: DriveService;
  private calendarService: CalendarService;

  constructor() {
    this.server = new Server(
      {
        name: "google-mcp-server",
        version: "1.0.0",
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

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Gmail tools
        {
          name: "gmail_send",
          description: "Send an email via Gmail",
          inputSchema: {
            type: "object",
            properties: {
              to: {
                type: "string",
                description: "Recipient email address",
              },
              subject: {
                type: "string",
                description: "Email subject",
              },
              body: {
                type: "string",
                description: "Email body (plain text or HTML)",
              },
              cc: {
                type: "string",
                description: "CC recipients (comma-separated)",
              },
              bcc: {
                type: "string",
                description: "BCC recipients (comma-separated)",
              },
              isHtml: {
                type: "boolean",
                description: "Whether the body is HTML",
                default: false,
              },
            },
            required: ["to", "subject", "body"],
          },
        },
        // Drive tools
        {
          name: "drive_upload",
          description: "Upload a file to Google Drive",
          inputSchema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Name of the file to create",
              },
              content: {
                type: "string",
                description: "File content",
              },
              mimeType: {
                type: "string",
                description: "MIME type of the file (default: text/plain)",
                default: "text/plain",
              },
              folderId: {
                type: "string",
                description: "Parent folder ID (optional)",
              },
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
              query: {
                type: "string",
                description: "Search query (optional)",
              },
              pageSize: {
                type: "number",
                description: "Number of files to return",
                default: 10,
              },
            },
          },
        },
        {
          name: "drive_delete",
          description: "Delete a file from Google Drive",
          inputSchema: {
            type: "object",
            properties: {
              fileId: {
                type: "string",
                description: "ID of the file to delete",
              },
            },
            required: ["fileId"],
          },
        },
        // Calendar tools
        {
          name: "calendar_create_event",
          description: "Create a new calendar event",
          inputSchema: {
            type: "object",
            properties: {
              summary: {
                type: "string",
                description: "Event title",
              },
              description: {
                type: "string",
                description: "Event description",
              },
              startTime: {
                type: "string",
                description: "Start time (ISO 8601 format, e.g., 2024-03-20T10:00:00Z)",
              },
              endTime: {
                type: "string",
                description: "End time (ISO 8601 format, e.g., 2024-03-20T11:00:00Z)",
              },
              location: {
                type: "string",
                description: "Event location",
              },
              attendees: {
                type: "string",
                description: "Comma-separated email addresses of attendees",
              },
              timezone: {
                type: "string",
                description: "IANA timezone (e.g., 'America/New_York', 'Europe/London', default: 'UTC')",
                default: "UTC",
              },
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
              maxResults: {
                type: "number",
                description: "Maximum number of events to return (default: 10)",
                default: 10,
              },
              timeMin: {
                type: "string",
                description: "Start of time range (ISO 8601 format)",
              },
              timeMax: {
                type: "string",
                description: "End of time range (ISO 8601 format)",
              },
              timezone: {
                type: "string",
                description: "IANA timezone for results",
              },
            },
          },
        },
        {
          name: "calendar_update_event",
          description: "Update an existing calendar event",
          inputSchema: {
            type: "object",
            properties: {
              eventId: {
                type: "string",
                description: "Event ID to update",
              },
              summary: {
                type: "string",
                description: "New event title",
              },
              description: {
                type: "string",
                description: "New event description",
              },
              startTime: {
                type: "string",
                description: "New start time (ISO 8601 format)",
              },
              endTime: {
                type: "string",
                description: "New end time (ISO 8601 format)",
              },
              location: {
                type: "string",
                description: "New event location",
              },
              attendees: {
                type: "string",
                description: "Comma-separated email addresses of attendees",
              },
              timezone: {
                type: "string",
                description: "IANA timezone for the event",
              },
            },
            required: ["eventId"],
          },
        },
        // Auth tool
        {
          name: "auth_status",
          description: "Check authentication status",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Ensure authentication
        const auth = await this.authManager.getAuthClient();

        switch (name) {
          // Gmail handlers
          case "gmail_send":
            return await this.gmailService.sendEmail(auth, args as any);

          // Drive handlers
          case "drive_upload":
            return await this.driveService.uploadFile(auth, args as any);
          case "drive_list":
            return await this.driveService.listFiles(auth, args as any);
          case "drive_delete":
            return await this.driveService.deleteFile(auth, args as any);

          // Calendar handlers
          case "calendar_create_event":
            return await this.calendarService.createEvent(auth, args as any);
          case "calendar_list_events":
            return await this.calendarService.listEvents(auth, args as any);
          case "calendar_update_event":
            return await this.calendarService.updateEvent(auth, args as any);

          // Auth status
          case "auth_status":
            return {
              content: [
                {
                  type: "text",
                  text: `Authentication status: ${
                    (await this.authManager.isAuthenticated())
                      ? "Authenticated"
                      : "Not authenticated"
                  }`,
                },
              ],
            };

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
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