import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import open from "open";
import http from "http";
import url from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class GoogleAuthManager {
  private auth: OAuth2Client | null = null;
  private tokenPath: string;
  private credentialsPath: string;
  private scopes: string[];
  private projectRoot: string;

  constructor() {
    // Find the project root by looking for package.json
    this.projectRoot = this.findProjectRoot();
    
    // Use project root for paths
    this.tokenPath = process.env.TOKEN_PATH || path.join(this.projectRoot, "tokens.json");
    this.credentialsPath = process.env.CREDENTIALS_PATH || path.join(this.projectRoot, "credentials.json");
    this.scopes = (process.env.GOOGLE_SCOPES || "").split(",").filter(Boolean);
    
    if (this.scopes.length === 0) {
      this.scopes = [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/tasks",
      ];
    }

    console.error(`Google Auth initialized with paths:`);
    console.error(`  Project root: ${this.projectRoot}`);
    console.error(`  Credentials: ${this.credentialsPath}`);
    console.error(`  Tokens: ${this.tokenPath}`);
  }

  private findProjectRoot(): string {
    // Start from the current module's directory and go up to find package.json
    // __dirname will be something like: /root/google-mcp-integration/dist/auth
    // We need to go up to: /root/google-mcp-integration
    
    // Since we know the structure (dist/auth/googleAuth.js), go up two levels
    const projectRoot = path.resolve(__dirname, '..', '..');
    
    console.error(`Resolved project root from ${__dirname} to ${projectRoot}`);
    
    return projectRoot;
  }

  async getAuthClient(): Promise<OAuth2Client> {
    if (this.auth) {
      return this.auth;
    }

    // Try to load saved tokens
    try {
      const tokens = await this.loadSavedTokens();
      if (tokens) {
        this.auth = tokens;
        return this.auth;
      }
    } catch (err) {
      // No saved tokens, continue to authentication
    }

    // Authenticate
    this.auth = await this.authenticate();
    await this.saveTokens(this.auth);
    return this.auth;
  }

  private async loadSavedTokens(): Promise<OAuth2Client | null> {
    try {
      const tokenData = await fs.readFile(this.tokenPath, "utf-8");
      const tokens = JSON.parse(tokenData);
      
      // Load credentials
      const credentialsData = await fs.readFile(this.credentialsPath, "utf-8");
      const credentials = JSON.parse(credentialsData);
      
      const client = new OAuth2Client(
        credentials.installed.client_id,
        credentials.installed.client_secret,
        credentials.installed.redirect_uris[0]
      );
      
      client.setCredentials(tokens);
      return client;
    } catch (err) {
      return null;
    }
  }

  private async saveTokens(client: OAuth2Client): Promise<void> {
    const tokens = client.credentials;
    await fs.writeFile(this.tokenPath, JSON.stringify(tokens, null, 2));
  }

  private async authenticate(): Promise<OAuth2Client> {
    // Check if credentials.json exists
    try {
      await fs.access(this.credentialsPath);
    } catch {
      throw new Error(
        `credentials.json not found at ${this.credentialsPath}. ` +
        "Please follow the setup instructions to create OAuth2 credentials."
      );
    }

    // Load credentials
    const credentialsData = await fs.readFile(this.credentialsPath, "utf-8");
    const credentials = JSON.parse(credentialsData);
    
    const client = new OAuth2Client(
      credentials.installed.client_id,
      credentials.installed.client_secret,
      credentials.installed.redirect_uris[0]
    );

    // Generate auth URL
    const authUrl = client.generateAuthUrl({
      access_type: "offline",
      scope: this.scopes,
    });

    console.error("Opening browser for authentication...");
    console.error(`If browser doesn't open, visit: ${authUrl}`);

    // Open browser
    await open(authUrl);

    // Start local server to receive the auth code
    const authCode = await this.waitForAuthCode();
    
    // Exchange auth code for tokens
    const { tokens } = await client.getToken(authCode);
    client.setCredentials(tokens);

    return client;
  }

  private async waitForAuthCode(): Promise<string> {
    return new Promise((resolve, reject) => {
      const server = http.createServer(async (req, res) => {
        try {
          if (req.url && req.url.includes("code=")) {
            const queryParams = url.parse(req.url, true).query;
            const code = queryParams.code as string;
            
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(`
              <html>
                <head>
                  <title>Authentication Successful</title>
                  <style>
                    body {
                      font-family: Arial, sans-serif;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      height: 100vh;
                      margin: 0;
                      background-color: #f0f0f0;
                    }
                    .container {
                      text-align: center;
                      padding: 40px;
                      background-color: white;
                      border-radius: 10px;
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    h1 { color: #4CAF50; }
                    p { color: #666; margin-top: 20px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>✅ Authentication Successful!</h1>
                    <p>You can now close this window and return to Claude Desktop.</p>
                    <p style="font-size: 14px; color: #999;">The Google MCP integration is ready to use.</p>
                  </div>
                </body>
              </html>
            `);
            
            server.close();
            resolve(code);
          } else {
            res.writeHead(404);
            res.end("Not found");
          }
        } catch (error) {
          server.close();
          reject(error);
        }
      });

      const port = 3000;
      server.listen(port, () => {
        console.error(`Listening for auth code on http://localhost:${port}`);
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        server.close();
        reject(new Error("Authentication timeout"));
      }, 5 * 60 * 1000);
    });
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const tokens = await this.loadSavedTokens();
      return tokens !== null;
    } catch {
      return false;
    }
  }

  async revokeTokens(): Promise<void> {
    try {
      await fs.unlink(this.tokenPath);
      this.auth = null;
    } catch (err) {
      // Token file doesn't exist, that's okay
    }
  }
}