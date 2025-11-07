# Google MCP Server

A Model Context Protocol (MCP) server that provides full integration with Google services including Gmail, Google Drive, and Google Calendar with read and write capabilities.

## Features

- **Gmail Integration**
  - Send emails with support for CC, BCC, and HTML content
  - UTF-8 character encoding support for international languages
  
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

2. **Place credentials file**
   - Ensure the downloaded `credentials.json` file is in the project root directory

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
      "args": ["/path/to/google-mcp-server/dist/index.js"]
    }
  }
}
```

Make sure that `credentials.json` is in the project root directory before starting the server.

### Available Tools

#### Gmail Tools

- **gmail_send**: Send an email
  ```
  Parameters:
  - to: Recipient email address (required)
  - subject: Email subject (required)
  - body: Email body (required)
  - cc: (optional) CC recipients (comma-separated)
  - bcc: (optional) BCC recipients (comma-separated)
  - isHtml: (optional) Whether body is HTML (default: false)
  ```

  All emails use UTF-8 character encoding and support international characters.

#### Drive Tools

- **drive_upload**: Upload a file to Google Drive
  ```
  Parameters:
  - name: Name of the file (required)
  - content: File content (required)
  - mimeType: (optional) MIME type (default: "text/plain")
  - folderId: (optional) Parent folder ID
  ```

- **drive_list**: List files in Drive
  ```
  Parameters:
  - query: (optional) Search query (Google Drive query format)
  - pageSize: (optional) Number of results (default: 10)
  ```

- **drive_delete**: Delete a file
  ```
  Parameters:
  - fileId: ID of file to delete (required)
  ```

#### Calendar Tools

- **calendar_create_event**: Create a calendar event
  ```
  Parameters:
  - summary: Event title (required)
  - startTime: Start time in ISO 8601 format (required)
  - endTime: End time in ISO 8601 format (required)
  - description: (optional) Event description
  - location: (optional) Event location
  - attendees: (optional) Comma-separated email addresses
  - timezone: (optional) IANA timezone (e.g., "America/New_York", default: "UTC")
  ```

- **calendar_list_events**: List calendar events
  ```
  Parameters:
  - maxResults: (optional) Maximum number of results (default: 10)
  - timeMin: (optional) Start of time range in ISO 8601 format
  - timeMax: (optional) End of time range in ISO 8601 format
  - timezone: (optional) IANA timezone for results
  ```

- **calendar_update_event**: Update an event
  ```
  Parameters:
  - eventId: Event ID to update (required)
  - summary: (optional) New title
  - description: (optional) New description
  - startTime: (optional) New start time in ISO 8601 format
  - endTime: (optional) New end time in ISO 8601 format
  - location: (optional) New location
  - attendees: (optional) Comma-separated email addresses
  - timezone: (optional) IANA timezone for the event
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
   - Verify that `credentials.json` exists in the project root

2. **Permission Errors**
   - Verify the OAuth scopes in your Google Cloud Console
   - Ensure your Google account has access to the resources you're trying to access
   - Check that your account is added as a test user in the OAuth consent screen

3. **API Quota Limits**
   - Google APIs have usage quotas
   - Check your quota usage in the Google Cloud Console

4. **Validation Errors**
   - Ensure email addresses are in valid format
   - ISO 8601 date format: `YYYY-MM-DDTHH:mm:ss.sssZ` or `YYYY-MM-DDTHH:mm:ss+00:00`
   - IANA timezone format: `America/New_York`, `Europe/London`, `UTC`, etc.

## License

MIT