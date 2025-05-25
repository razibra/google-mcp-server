# Windows Installation Guide

This guide walks you through installing the Google MCP Server on Windows and configuring it with Claude Desktop.

## Prerequisites

- Windows 10 or higher
- Node.js 18+ ([Download](https://nodejs.org/))
- Claude Desktop ([Download](https://claude.ai/desktop))
- Google Cloud credentials (see [Google Cloud Setup Guide](./GOOGLE_CLOUD_SETUP.md))

## Installation Steps

### 1. Download and Extract

1. Download the repository as a ZIP file from GitHub
2. Extract to a location like `C:\google-mcp-server`
3. Open Command Prompt or PowerShell as Administrator
4. Navigate to the extracted folder:
   ```cmd
   cd C:\google-mcp-server
   ```

### 2. Run Installation Script

```cmd
install-windows.bat
```

This script will:
- Check for Node.js installation
- Install all dependencies
- Build the TypeScript code
- Show you the server path for Claude Desktop

### 3. Set Up Credentials

1. Copy your `credentials.json` file (from Google Cloud Console) to `C:\google-mcp-server\`
2. Copy `.env.example` to `.env`:
   ```cmd
   copy .env.example .env
   ```
3. Edit `.env` with Notepad:
   ```cmd
   notepad .env
   ```
4. Fill in your Google credentials from `credentials.json`

### 4. Configure Claude Desktop

1. Open File Explorer
2. Type `%APPDATA%\Claude` in the address bar and press Enter
3. Open `claude_desktop_config.json` in Notepad
4. Add the Google MCP Server configuration:

```json
{
  "mcpServers": {
    "google-mcp-server": {
      "command": "node",
      "args": ["C:\\google-mcp-server\\dist\\index.js"],
      "env": {
        "GOOGLE_CREDENTIALS_PATH": "C:\\google-mcp-server\\credentials.json"
      }
    }
  }
}
```

**Important**: 
- Use double backslashes `\\` in the paths
- Make sure the paths match your installation location

### 5. Restart Claude Desktop

1. Completely quit Claude Desktop (check system tray)
2. Start Claude Desktop again
3. The Google MCP Server should now be available

## First-Time Authentication

1. When you first use a Google tool in Claude, a browser window will open
2. Log in to your Google account
3. Authorize the application
4. The authentication token will be saved automatically

## Testing the Installation

In Claude Desktop, try:
- "Check Google auth status" - Should show authentication status
- "Send a test email to myself" - Should send an email
- "List my Google Drive files" - Should show your files

## Troubleshooting

### Server not appearing in Claude

1. Check the config file syntax (valid JSON)
2. Verify all paths use double backslashes
3. Make sure Node.js is in your PATH
4. Check Claude Desktop developer console for errors (Ctrl+Shift+I)

### Authentication fails

1. Delete `token.json` if it exists
2. Make sure `credentials.json` is in the correct location
3. Verify your Google Cloud project setup

### "Command not found" errors

1. Make sure Node.js is installed and in PATH
2. Try using the full path to node.exe:
   ```json
   "command": "C:\\Program Files\\nodejs\\node.exe"
   ```

## Hebrew Email Support

This server includes automatic Hebrew/RTL support. When sending emails with Hebrew content:
- Content is automatically detected
- Proper RTL formatting is applied
- Email clients will display Hebrew text correctly

Example in Claude:
```
Send an email to example@gmail.com with subject "בדיקה" and body "שלום! זוהי הודעת בדיקה בעברית."
```