# Google Cloud Setup Guide

This guide walks you through setting up Google Cloud credentials for the Google MCP Server.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "Google MCP Server")
5. Click "Create"

## Step 2: Enable Required APIs

1. In your project, go to **APIs & Services → Enable APIs and Services**
2. Search for and enable each of these APIs:
   - **Gmail API** - For sending emails
   - **Google Drive API** - For file management
   - **Google Calendar API** - For calendar operations

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Select "External" user type
3. Click "Create"
4. Fill in the required fields:
   - **App name**: Google MCP Server
   - **User support email**: Your email
   - **Developer contact**: Your email
5. Click "Save and Continue"
6. On the Scopes page, click "Add or Remove Scopes"
7. Add these scopes:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/calendar`
8. Click "Save and Continue"
9. Add your email as a test user
10. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Desktop app" as Application type
4. Name it "Google MCP Desktop Client"
5. Click "Create"
6. Click "Download JSON" to download the credentials
7. Rename the file to `credentials.json`
8. Place it in the root of your google-mcp-server directory

## Step 5: Set Up Environment Variables

1. Copy `.env.example` to `.env`
2. Open the `credentials.json` file
3. Copy the `client_id` and `client_secret` values to your `.env` file:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

## Important Notes

- **Keep credentials.json secure** - This file contains sensitive information
- **Never commit credentials** - Both `credentials.json` and `.env` are in `.gitignore`
- **Test users only** - While in "Testing" status, only test users can authenticate
- **Publishing** - To allow any Google user, you'll need to verify your app

## Troubleshooting

### "Access blocked" error
- Make sure you added your email as a test user
- Check that the OAuth consent screen is configured

### "Scope not authorized" error
- Verify all required scopes are added in the OAuth consent screen
- Delete `token.json` and re-authenticate

### "API not enabled" error
- Double-check that all three APIs are enabled in your project
- Wait a few minutes after enabling APIs