import { google, drive_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { Readable } from "stream";
import { UploadFileParams, ListFilesParams, DeleteFileParams, GoogleAPIError } from "../types.js";
import { validateRequired, validateMimeType, validateId } from "../utils/validation.js";

export class DriveService {
  async uploadFile(auth: OAuth2Client, params: UploadFileParams) {
    // Validate required fields
    validateRequired(params.name, 'name');
    validateRequired(params.content, 'content');

    // Validate optional fields
    if (params.mimeType) {
      validateMimeType(params.mimeType);
    }
    if (params.folderId) {
      validateId(params.folderId, 'folderId');
    }

    const drive = google.drive({ version: "v3", auth });

    const fileMetadata: drive_v3.Schema$File = {
      name: params.name,
    };

    if (params.folderId) {
      fileMetadata.parents = [params.folderId];
    }

    // Create a readable stream from the content
    const stream = Readable.from([params.content]);

    try {
      const result = await drive.files.create({
        requestBody: fileMetadata,
        media: {
          mimeType: params.mimeType || "text/plain",
          body: stream,
        },
        fields: "id, name, webViewLink",
      });

      return {
        content: [
          {
            type: "text",
            text: `File uploaded successfully!\nFile ID: ${result.data.id}\nFile Name: ${result.data.name}\nWeb Link: ${result.data.webViewLink}`,
          },
        ],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to upload file: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to upload file: ${String(error)}`);
    }
  }

  async listFiles(auth: OAuth2Client, params: ListFilesParams = {}) {
    const drive = google.drive({ version: "v3", auth });

    try {
      const result = await drive.files.list({
        pageSize: params.pageSize || 10,
        q: params.query,
        fields: "files(id, name, mimeType, createdTime, modifiedTime, size)",
      });

      const files = result.data.files || [];

      if (files.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No files found.",
            },
          ],
        };
      }

      const fileList = files.map((file) => {
        return `- ${file.name} (ID: ${file.id}, Type: ${file.mimeType}, Modified: ${file.modifiedTime})`;
      }).join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${files.length} files:\n${fileList}`,
          },
        ],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to list files: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to list files: ${String(error)}`);
    }
  }

  async deleteFile(auth: OAuth2Client, params: DeleteFileParams) {
    // Validate required fields
    validateId(params.fileId, 'fileId');

    const drive = google.drive({ version: "v3", auth });

    try {
      await drive.files.delete({
        fileId: params.fileId,
      });

      return {
        content: [
          {
            type: "text",
            text: `File deleted successfully (ID: ${params.fileId})`,
          },
        ],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to delete file: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to delete file: ${String(error)}`);
    }
  }
}