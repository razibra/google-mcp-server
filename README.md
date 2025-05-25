# Google MCP Server

A Model Context Protocol (MCP) server that provides full integration with Google services including Gmail, Google Drive, and Google Calendar with read and write capabilities.

## Features

- **Gmail Integration**
  - Send emails with support for CC, BCC, and HTML content
  - Full Hebrew/RTL language support with automatic formatting
  
- **Google Drive Integration**
  - Upload files to Drive
  - List files with search capability
  - Delete files
  
- **Google Calendar Integration**
  - Create calendar events with attendees
  - List events with time range filtering
  - Update existing events

## Setup Instructions

### 1. Google Cloud Console Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Click "Create Project" or select an existing project
   - Note your project ID

2. **Enable Required APIs**
   - In the Cloud Console, go to "APIs & Services" > "Enable APIs and Services"
   - Search for and enable these APIs:
     - Gmail API
     - Google Drive API
     - Google Calendar API

3. **Create OAuth2 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - If prompted, configure the OAuth consent screen:
     - Choose "External" for user type
     - Fill in required fields (app name, user support email, developer contact)
     - Add scopes:
       - `https://www.googleapis.com/auth/gmail.send`
       - `https://www.googleapis.com/auth/drive.file`
       - `https://www.googleapis.com/auth/calendar`
     - Add your email as a test user
   - For Application type, choose "Desktop app"
   - Download the credentials JSON file
   - Rename it to `credentials.json` and place it in the project root

### 2. Local Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   - Copy `.env.example` to `.env`
   - Fill in your Google OAuth2 credentials from the downloaded JSON file:
     ```
     GOOGLE_CLIENT_ID=your_client_id
     GOOGLE_CLIENT_SECRET=your_client_secret
     ```

3. **Build the project**
   ```bash
   npm run build
   ```

### 3. Authentication

On first run, the server will:
1. Open your default browser for Google authentication
2. Ask you to log in and authorize the application
3. Save the authentication tokens locally in `tokens.json`

## Usage with MCP Client

### Configure your MCP client

Add this server to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "google": {
      "command": "node",
      "args": ["/path/to/google-mcp-integration/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "your_client_id",
        "GOOGLE_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### Available Tools

#### Gmail Tools

- **gmail_send**: Send an email
  ```
  Parameters:
  - to: Recipient email address
  - subject: Email subject
  - body: Email body
  - cc: (optional) CC recipients
  - bcc: (optional) BCC recipients
  - isHtml: (optional) Whether body is HTML
  ```

  **Hebrew/RTL Support**: The server automatically detects Hebrew content and applies proper RTL formatting. When sending Hebrew emails, the content is wrapped with `dir="rtl"` and right-aligned styling for proper display.

#### Drive Tools

- **drive_upload**: Upload a file to Google Drive
  ```
  Parameters:
  - fileName: Name of the file
  - content: File content
  - mimeType: (optional) MIME type
  - folderId: (optional) Parent folder ID
  ```

- **drive_list**: List files in Drive
  ```
  Parameters:
  - query: (optional) Search query
  - pageSize: (optional) Number of results
  ```

- **drive_delete**: Delete a file
  ```
  Parameters:
  - fileId: ID of file to delete
  ```

#### Calendar Tools

- **calendar_create_event**: Create a calendar event
  ```
  Parameters:
  - summary: Event title
  - description: Event description
  - startTime: Start time (ISO 8601)
  - endTime: End time (ISO 8601)
  - attendees: (optional) List of email addresses
  - location: (optional) Event location
  - calendarId: (optional) Calendar ID (default: primary)
  ```

- **calendar_list_events**: List calendar events
  ```
  Parameters:
  - calendarId: (optional) Calendar ID
  - maxResults: (optional) Maximum results
  - timeMin: (optional) Start of time range
  - timeMax: (optional) End of time range
  ```

- **calendar_update_event**: Update an event
  ```
  Parameters:
  - eventId: Event ID to update
  - calendarId: (optional) Calendar ID
  - summary: (optional) New title
  - description: (optional) New description
  - startTime: (optional) New start time
  - endTime: (optional) New end time
  - location: (optional) New location
  ```

#### Authentication Tool

- **auth_status**: Check authentication status

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Security Notes

- The `credentials.json` file contains sensitive OAuth2 credentials - never commit it to version control
- The `tokens.json` file contains access tokens - keep it secure
- The `.env` file contains sensitive data - never commit it
- Use the principle of least privilege when setting OAuth scopes

## Troubleshooting

1. **Authentication Issues**
   - Delete `tokens.json` and re-authenticate
   - Ensure your Google Cloud project has the required APIs enabled
   - Check that your OAuth consent screen is properly configured

2. **Permission Errors**
   - Verify the OAuth scopes in your `.env` file
   - Ensure your Google account has access to the resources you're trying to access

3. **API Quota Limits**
   - Google APIs have usage quotas
   - Check your quota usage in the Google Cloud Console

## License

MIT