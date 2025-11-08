# Google MCP Server

A comprehensive Model Context Protocol (MCP) server providing complete integration with Google Cloud Platform and Google Workspace services. This server offers 61 powerful tools across 13 Google services, from productivity apps to advanced AI capabilities.

## 🌟 Overview

This MCP server is the most comprehensive Google integration available, combining:
- **Google Workspace** - Gmail, Drive, Calendar, Sheets, Tasks, Apps Script
- **Advanced AI** - Gemini 2.5 Pro, Vision API, Translation, Imagen 3, Veo 3
- **Cloud Platform** - Cloud Storage, BigQuery
- **Content & Media** - YouTube Data API

**Total: 13 Services | 61 Tools | Version 5.0.0**

---

## 📋 Services & Tools

### 📧 Gmail (6 tools)
- **gmail_send** - Send emails with HTML, CC, BCC support
- **gmail_list** - List emails from inbox with filtering
- **gmail_read** - Read specific email by ID
- **gmail_search** - Search emails using Gmail query syntax
- **gmail_modify_labels** - Add/remove labels from emails
- **gmail_list_labels** - List all available labels

### 📁 Google Drive (6 tools)
- **drive_upload** - Upload files to Drive
- **drive_list** - List files with search
- **drive_read** - Read file content
- **drive_download** - Download/export files (supports Google Workspace formats)
- **drive_search** - Advanced file search
- **drive_delete** - Delete files

### 📅 Google Calendar (3 tools)
- **calendar_create_event** - Create events with attendees and timezone support
- **calendar_list_events** - List events with time range filtering
- **calendar_update_event** - Update existing events

### 📊 Google Sheets (4 tools)
- **sheets_create** - Create new spreadsheets
- **sheets_read** - Read data from sheets
- **sheets_write** - Write data to sheets
- **sheets_append** - Append data to sheets

### ✅ Google Tasks (5 tools)
- **tasks_create** - Create new tasks
- **tasks_list** - List tasks from task lists
- **tasks_update** - Update existing tasks
- **tasks_delete** - Delete tasks
- **tasks_list_lists** - List all task lists

### 🧠 Gemini 2.5 AI (3 tools)
- **gemini_generate** - Generate text with Google's most advanced AI model
- **gemini_chat** - Multi-turn conversations with context
- **gemini_vision** - Analyze images with AI-powered vision

### 👁️ Cloud Vision API (3 tools)
- **vision_analyze** - Comprehensive image analysis
- **vision_ocr** - Extract text from images (OCR)
- **vision_labels** - Detect objects, scenes, and concepts

### 🌐 Cloud Translation API (3 tools)
- **translate** - Translate text to any supported language
- **detect_language** - Detect language of text
- **list_languages** - List all supported languages

### 🎨 Imagen 3 - Image Generation (2 tools)
- **imagen_generate** - Generate images from text descriptions
- **imagen_edit** - Edit images with AI (inpainting/outpainting)

### 🎬 Veo 3 - Video Generation (2 tools)
- **veo_generate** - Generate videos from text (requires special access)
- **veo_check_availability** - Check API access status

### 🤖 Apps Script (4 tools)
- **apps_script_create_project** - Create automation projects
- **apps_script_update_content** - Update code files
- **apps_script_run_function** - Execute functions remotely
- **apps_script_get_deployments** - Manage deployments

### 🎥 YouTube Data API (5 tools)
- **youtube_search** - Search videos, channels, playlists
- **youtube_list_videos** - List videos from channels
- **youtube_get_video_details** - Get comprehensive video info
- **youtube_create_playlist** - Create new playlists
- **youtube_add_to_playlist** - Add videos to playlists

### ☁️ Cloud Storage (5 tools)
- **storage_create_bucket** - Create storage buckets
- **storage_upload_file** - Upload files (text/base64)
- **storage_download_file** - Download files
- **storage_list_files** - List bucket contents
- **storage_delete_file** - Delete files

### 📊 BigQuery (5 tools)
- **bigquery_query** - Run SQL queries on massive datasets
- **bigquery_create_dataset** - Create new datasets
- **bigquery_create_table** - Define table schemas
- **bigquery_insert_data** - Load data into tables
- **bigquery_list_tables** - Browse dataset contents

### 🔐 Authentication (1 tool)
- **auth_status** - Check authentication status

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Google Cloud Project
- Google Account

### 1. Google Cloud Console Setup

#### Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Create Project" or select an existing project
3. Note your project ID for later use

#### Enable Required APIs
In the Cloud Console, go to "APIs & Services" > "Library" and enable:

**Core APIs:**
- Gmail API
- Google Drive API
- Google Calendar API
- Google Sheets API
- Google Tasks API

**AI & ML APIs:**
- Cloud Vision API
- Cloud Translation API
- Vertex AI API (for Imagen & Veo)

**Cloud Platform APIs:**
- Cloud Storage API
- BigQuery API

**Other APIs:**
- Apps Script API
- YouTube Data API v3

#### Create OAuth2 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure OAuth consent screen if prompted:
   - Choose "External" for user type
   - Fill in required fields (app name, support email)
   - Add test users (your email)
4. For Application type, choose "Desktop app"
5. Download the credentials JSON file
6. Rename it to `credentials.json` and place in project root

### 2. Local Setup

```bash
# Clone or navigate to the project directory
cd google-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

### 3. Environment Variables (Optional)

Create a `.env` file in the project root:

```bash
# Required for Gemini AI
GOOGLE_AI_API_KEY=your_gemini_api_key_here

# Required for Cloud Storage, BigQuery, Imagen, Veo
GOOGLE_CLOUD_PROJECT=your_project_id

# Optional: Custom paths
CREDENTIALS_PATH=/path/to/credentials.json
TOKEN_PATH=/path/to/tokens.json
```

**Getting a Gemini API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key to your `.env` file

### 4. First Run & Authentication

On first run, the server will:
1. Open your default browser for Google authentication
2. Ask you to log in and authorize the application
3. Save authentication tokens in `tokens.json`

The tokens are automatically refreshed when needed.

---

## 💻 Usage with MCP Clients

### Claude Desktop Configuration

Add to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "google": {
      "command": "node",
      "args": ["/absolute/path/to/google-mcp-server/dist/index.js"],
      "env": {
        "GOOGLE_AI_API_KEY": "your_api_key_here",
        "GOOGLE_CLOUD_PROJECT": "your_project_id"
      }
    }
  }
}
```

### Other MCP Clients

The server runs via stdio transport and is compatible with any MCP client.

---

## 📖 Tool Documentation

### Gmail Tools

#### gmail_send
Send an email via Gmail.

**Parameters:**
- `to` (string, required) - Recipient email address
- `subject` (string, required) - Email subject
- `body` (string, required) - Email body
- `cc` (string, optional) - CC recipients (comma-separated)
- `bcc` (string, optional) - BCC recipients (comma-separated)
- `isHtml` (boolean, optional) - Whether body is HTML (default: false)

**Example:**
```json
{
  "to": "user@example.com",
  "subject": "Hello from MCP",
  "body": "This is a test email",
  "isHtml": false
}
```

#### gmail_search
Search emails using Gmail query syntax.

**Parameters:**
- `query` (string, required) - Gmail search query
- `maxResults` (number, optional) - Maximum results (default: 10)

**Example queries:**
- `is:unread from:example@gmail.com`
- `has:attachment after:2024/01/01`
- `subject:invoice older_than:1m`

### Gemini AI Tools

#### gemini_generate
Generate text using Gemini 2.5 Pro, Google's most advanced AI model.

**Parameters:**
- `prompt` (string, required) - Text prompt for generation
- `model` (string, optional) - Model to use (default: gemini-2.5-pro-latest)
  - Options: gemini-2.5-pro-latest, gemini-2.5-flash-latest, gemini-2.0-flash-exp
- `temperature` (number, optional) - Temperature 0-2 (default: 1)
- `maxTokens` (number, optional) - Maximum tokens to generate

**Example:**
```json
{
  "prompt": "Explain quantum computing in simple terms",
  "temperature": 0.7,
  "maxTokens": 500
}
```

#### gemini_vision
Analyze images with Gemini's multimodal capabilities.

**Parameters:**
- `prompt` (string, required) - Question or instruction about the image
- `imageUrl` (string, optional) - URL of the image
- `imageData` (string, optional) - Base64-encoded image data
- `model` (string, optional) - Model to use (default: gemini-2.5-pro-latest)

**Example:**
```json
{
  "prompt": "What objects are in this image?",
  "imageUrl": "https://example.com/image.jpg"
}
```

### Imagen 3 Tools

#### imagen_generate
Generate high-quality images from text descriptions.

**Parameters:**
- `prompt` (string, required) - Description of the image to generate
- `negativePrompt` (string, optional) - What to avoid in the image
- `aspectRatio` (string, optional) - "1:1", "9:16", "16:9", "4:3", "3:4" (default: "1:1")
- `numberOfImages` (number, optional) - 1-4 images (default: 1)
- `model` (string, optional) - imagen-3.0-generate-001 or imagen-3.0-fast-generate-001
- `safetyFilterLevel` (string, optional) - block_most, block_some, block_few
- `personGeneration` (string, optional) - allow_adult, allow_all, dont_allow

**Example:**
```json
{
  "prompt": "A serene mountain landscape at sunset",
  "aspectRatio": "16:9",
  "numberOfImages": 2
}
```

### BigQuery Tools

#### bigquery_query
Run SQL queries on massive datasets.

**Parameters:**
- `query` (string, required) - SQL query
- `datasetId` (string, optional) - Default dataset ID
- `maxResults` (number, optional) - Maximum results (default: 100)
- `useLegacySql` (boolean, optional) - Use legacy SQL (default: false)

**Example:**
```json
{
  "query": "SELECT name, COUNT(*) as count FROM `project.dataset.table` GROUP BY name ORDER BY count DESC LIMIT 10"
}
```

### Cloud Storage Tools

#### storage_upload_file
Upload files to Cloud Storage.

**Parameters:**
- `bucketName` (string, required) - Bucket name
- `fileName` (string, required) - File name/path in bucket
- `content` (string, required) - File content (base64 or text)
- `contentType` (string, optional) - MIME type
- `metadata` (object, optional) - Custom metadata

**Example:**
```json
{
  "bucketName": "my-bucket",
  "fileName": "data/report.csv",
  "content": "name,value\nitem1,100\nitem2,200",
  "contentType": "text/csv"
}
```

### YouTube Tools

#### youtube_search
Search for videos, channels, or playlists.

**Parameters:**
- `query` (string, required) - Search query
- `maxResults` (number, optional) - Maximum results (default: 10)
- `type` (string, optional) - "video", "channel", or "playlist"
- `order` (string, optional) - "date", "rating", "relevance", "title", "viewCount"

**Example:**
```json
{
  "query": "machine learning tutorials",
  "type": "video",
  "order": "viewCount",
  "maxResults": 5
}
```

---

## 🔒 Security & Privacy

- **Credentials:** `credentials.json` and `tokens.json` are automatically excluded from git via `.gitignore`
- **OAuth Scopes:** Only requested permissions are granted
- **Token Storage:** Tokens are stored locally and automatically refreshed
- **Environment Variables:** Sensitive data should be in `.env` (also gitignored)

**Never commit:**
- `credentials.json`
- `tokens.json`
- `.env` files
- Any files containing API keys

---

## 🛠️ Development

### Build
```bash
npm run build
```

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Start Server
```bash
npm start
```

---

## 📝 OAuth Scopes

The server requests the following OAuth scopes:

**Workspace:**
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/drive`
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/tasks`
- `https://www.googleapis.com/auth/script.projects`

**YouTube:**
- `https://www.googleapis.com/auth/youtube`
- `https://www.googleapis.com/auth/youtube.readonly`

**AI & Cloud:**
- `https://www.googleapis.com/auth/cloud-vision`
- `https://www.googleapis.com/auth/cloud-translation`
- `https://www.googleapis.com/auth/cloud-platform` (includes Storage & BigQuery)

---

## 🐛 Troubleshooting

### Authentication Issues
- Ensure `credentials.json` is in the project root
- Delete `tokens.json` and re-authenticate if you encounter token errors
- Check that all required APIs are enabled in Google Cloud Console

### API Access Issues
- **Gemini:** Ensure `GOOGLE_AI_API_KEY` is set
- **Cloud Services:** Ensure `GOOGLE_CLOUD_PROJECT` is set
- **Veo 3:** May require special access/allowlist from Google

### Build Errors
```bash
# Clean and rebuild
rm -rf dist
npm run build
```

---

## 📚 Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [Google Cloud Console](https://console.cloud.google.com)
- [Google AI Studio](https://makersuite.google.com)
- [Google Workspace APIs](https://developers.google.com/workspace)

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

## ⭐ Project Stats

- **Version:** 5.0.0
- **Services:** 13
- **Tools:** 61
- **Language:** TypeScript
- **MCP SDK:** 1.0.0+
- **Build Status:** ✅ Passing

---

**Built with ❤️ for the MCP community**
