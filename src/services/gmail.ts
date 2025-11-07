import { google, gmail_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { SendEmailParams, GoogleAPIError } from "../types.js";
import { validateEmail, validateEmails, validateRequired } from "../utils/validation.js";

export class GmailService {
  async sendEmail(auth: OAuth2Client, params: SendEmailParams) {
    // Validate required fields
    validateRequired(params.to, 'to');
    validateRequired(params.subject, 'subject');
    validateRequired(params.body, 'body');

    // Validate email addresses
    validateEmail(params.to);
    if (params.cc) {
      validateEmails(params.cc);
    }
    if (params.bcc) {
      validateEmails(params.bcc);
    }
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to send email: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to send email: ${String(error)}`);
    }
  }

  private constructEmail(params: SendEmailParams): string {
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