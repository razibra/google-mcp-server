import { google, gmail_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export class GmailService {
  async sendEmail(auth: OAuth2Client, params: any) {
    const gmail = google.gmail({ version: "v1", auth });

    // Construct email
    const email = this.constructEmail(params);
    
    // Convert to base64
    const encodedMessage = Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    try {
      const result = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedMessage,
        },
      });

      return {
        content: [
          {
            type: "text",
            text: `Email sent successfully! Message ID: ${result.data.id}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to send email: ${error}`);
    }
  }

  private constructEmail(params: any): string {
    const lines = [];
    
    // Headers
    lines.push(`To: ${params.to}`);
    lines.push(`Subject: ${params.subject}`);
    
    if (params.cc) {
      lines.push(`Cc: ${params.cc}`);
    }
    
    if (params.bcc) {
      lines.push(`Bcc: ${params.bcc}`);
    }
    
    if (params.isHtml) {
      lines.push("Content-Type: text/html; charset=utf-8");
    } else {
      lines.push("Content-Type: text/plain; charset=utf-8");
    }
    
    lines.push(""); // Empty line between headers and body
    lines.push(params.body);
    
    return lines.join("\r\n");
  }
}