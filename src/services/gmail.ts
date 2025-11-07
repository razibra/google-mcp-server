import { google, gmail_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import {
  SendEmailParams,
  ListEmailsParams,
  ReadEmailParams,
  SearchEmailsParams,
  ModifyEmailLabelsParams,
  GoogleAPIError
} from "../types.js";
import { validateEmail, validateEmails, validateRequired, validateId } from "../utils/validation.js";

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

  async listEmails(auth: OAuth2Client, params: ListEmailsParams = {}) {
    const gmail = google.gmail({ version: "v1", auth });

    try {
      const listParams: any = {
        userId: "me",
        maxResults: params.maxResults || 10,
      };

      if (params.query) {
        listParams.q = params.query;
      }

      if (params.labelIds) {
        listParams.labelIds = params.labelIds.split(',').map(id => id.trim());
      }

      const result = await gmail.users.messages.list(listParams);
      const messages = result.data.messages || [];

      if (messages.length === 0) {
        return {
          content: [{
            type: "text",
            text: "No emails found.",
          }],
        };
      }

      // Get details for each message
      const detailedMessages = await Promise.all(
        messages.slice(0, params.maxResults || 10).map(async (msg) => {
          const details = await gmail.users.messages.get({
            userId: "me",
            id: msg.id!,
            format: "metadata",
            metadataHeaders: ["From", "To", "Subject", "Date"],
          });

          const headers = details.data.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

          return {
            id: msg.id,
            subject: getHeader("Subject"),
            from: getHeader("From"),
            date: getHeader("Date"),
            snippet: details.data.snippet || "",
          };
        })
      );

      const emailList = detailedMessages
        .map((email) => `- [${email.id}] ${email.subject}\n  From: ${email.from}\n  Date: ${email.date}\n  Preview: ${email.snippet}`)
        .join("\n\n");

      return {
        content: [{
          type: "text",
          text: `Found ${messages.length} emails:\n\n${emailList}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to list emails: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to list emails: ${String(error)}`);
    }
  }

  async readEmail(auth: OAuth2Client, params: ReadEmailParams) {
    validateId(params.messageId, 'messageId');

    const gmail = google.gmail({ version: "v1", auth });

    try {
      const format = params.format || 'full';
      const result = await gmail.users.messages.get({
        userId: "me",
        id: params.messageId,
        format: format,
      });

      const headers = result.data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

      let body = "";
      if (format === 'full') {
        // Extract body from payload
        const parts = result.data.payload?.parts || [result.data.payload];
        for (const part of parts) {
          if (part?.mimeType === "text/plain" && part.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString('utf-8');
            break;
          } else if (part?.mimeType === "text/html" && part.body?.data && !body) {
            body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          }
        }
      }

      return {
        content: [{
          type: "text",
          text: `Email Details:
ID: ${result.data.id}
Thread ID: ${result.data.threadId}
From: ${getHeader("From")}
To: ${getHeader("To")}
Subject: ${getHeader("Subject")}
Date: ${getHeader("Date")}
Labels: ${(result.data.labelIds || []).join(", ")}

${body ? `Body:\n${body}` : `Snippet: ${result.data.snippet || ""}`}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to read email: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to read email: ${String(error)}`);
    }
  }

  async searchEmails(auth: OAuth2Client, params: SearchEmailsParams) {
    validateRequired(params.query, 'query');

    return this.listEmails(auth, {
      query: params.query,
      maxResults: params.maxResults || 10,
    });
  }

  async modifyEmailLabels(auth: OAuth2Client, params: ModifyEmailLabelsParams) {
    validateId(params.messageId, 'messageId');

    const gmail = google.gmail({ version: "v1", auth });

    try {
      const modifyParams: any = {
        userId: "me",
        id: params.messageId,
        requestBody: {},
      };

      if (params.addLabelIds) {
        modifyParams.requestBody.addLabelIds = params.addLabelIds.split(',').map(id => id.trim());
      }

      if (params.removeLabelIds) {
        modifyParams.requestBody.removeLabelIds = params.removeLabelIds.split(',').map(id => id.trim());
      }

      const result = await gmail.users.messages.modify(modifyParams);

      return {
        content: [{
          type: "text",
          text: `Email labels modified successfully!\nMessage ID: ${result.data.id}\nCurrent Labels: ${(result.data.labelIds || []).join(", ")}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to modify email labels: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to modify email labels: ${String(error)}`);
    }
  }

  async listLabels(auth: OAuth2Client) {
    const gmail = google.gmail({ version: "v1", auth });

    try {
      const result = await gmail.users.labels.list({
        userId: "me",
      });

      const labels = result.data.labels || [];
      const labelList = labels
        .map((label) => `- ${label.name} (ID: ${label.id})`)
        .join("\n");

      return {
        content: [{
          type: "text",
          text: `Available Labels:\n\n${labelList}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to list labels: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to list labels: ${String(error)}`);
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