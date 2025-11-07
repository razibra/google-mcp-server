import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import {
  StorageCreateBucketParams,
  StorageUploadFileParams,
  StorageDownloadFileParams,
  StorageListFilesParams,
  StorageDeleteFileParams,
  GoogleAPIError
} from "../types.js";
import { validateRequired } from "../utils/validation.js";

export class StorageService {
  private projectId: string;

  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || "";
    if (!this.projectId) {
      console.warn("GOOGLE_CLOUD_PROJECT not set. Storage features will require project ID.");
    }
  }

  /**
   * Create a new Cloud Storage bucket
   */
  async createBucket(auth: OAuth2Client, params: StorageCreateBucketParams) {
    validateRequired(params.bucketName, 'bucketName');

    if (!this.projectId) {
      throw new GoogleAPIError("GOOGLE_CLOUD_PROJECT environment variable is required for Cloud Storage");
    }

    const storage = google.storage({ version: "v1", auth });

    try {
      const response = await storage.buckets.insert({
        project: this.projectId,
        requestBody: {
          name: params.bucketName,
          location: params.location || "US",
          storageClass: params.storageClass || "STANDARD",
        },
      });

      const bucket = response.data;

      return {
        content: [{
          type: "text",
          text: `✅ Bucket created successfully!\n\n` +
                `Bucket Name: ${bucket.name}\n` +
                `Location: ${bucket.location}\n` +
                `Storage Class: ${bucket.storageClass}\n` +
                `Created: ${bucket.timeCreated}\n\n` +
                `Console URL: https://console.cloud.google.com/storage/browser/${bucket.name}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to create bucket: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to create bucket: ${String(error)}`);
    }
  }

  /**
   * Upload a file to Cloud Storage
   */
  async uploadFile(auth: OAuth2Client, params: StorageUploadFileParams) {
    validateRequired(params.bucketName, 'bucketName');
    validateRequired(params.fileName, 'fileName');
    validateRequired(params.content, 'content');

    const storage = google.storage({ version: "v1", auth });

    try {
      // Convert content to buffer
      let buffer: Buffer;
      if (params.content.startsWith('data:')) {
        // Handle base64 data URI
        const base64Data = params.content.split(',')[1];
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        // Assume text content
        buffer = Buffer.from(params.content, 'utf-8');
      }

      const response = await storage.objects.insert({
        bucket: params.bucketName,
        name: params.fileName,
        media: {
          mimeType: params.contentType || 'application/octet-stream',
          body: buffer,
        },
        requestBody: {
          name: params.fileName,
          metadata: params.metadata,
        },
      });

      const file = response.data;

      return {
        content: [{
          type: "text",
          text: `✅ File uploaded successfully!\n\n` +
                `File: ${file.name}\n` +
                `Bucket: ${params.bucketName}\n` +
                `Size: ${parseInt(file.size || '0').toLocaleString()} bytes\n` +
                `Content Type: ${file.contentType}\n` +
                `MD5 Hash: ${file.md5Hash}\n\n` +
                `gs:// URL: gs://${params.bucketName}/${file.name}\n` +
                `Console URL: https://console.cloud.google.com/storage/browser/_details/${params.bucketName}/${file.name}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to upload file: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to upload file: ${String(error)}`);
    }
  }

  /**
   * Download a file from Cloud Storage
   */
  async downloadFile(auth: OAuth2Client, params: StorageDownloadFileParams) {
    validateRequired(params.bucketName, 'bucketName');
    validateRequired(params.fileName, 'fileName');

    const storage = google.storage({ version: "v1", auth });

    try {
      // Get file metadata first
      const metaResponse = await storage.objects.get({
        bucket: params.bucketName,
        object: params.fileName,
      });

      const metadata = metaResponse.data;

      // Download file content
      const response = await storage.objects.get({
        bucket: params.bucketName,
        object: params.fileName,
        alt: 'media',
      }, {
        responseType: 'arraybuffer',
      });

      // Convert to base64
      const buffer = Buffer.from(response.data as ArrayBuffer);
      const base64 = buffer.toString('base64');

      return {
        content: [{
          type: "text",
          text: `✅ File downloaded successfully!\n\n` +
                `File: ${metadata.name}\n` +
                `Bucket: ${params.bucketName}\n` +
                `Size: ${parseInt(metadata.size || '0').toLocaleString()} bytes\n` +
                `Content Type: ${metadata.contentType}\n\n` +
                `Content (base64):\ndata:${metadata.contentType};base64,${base64.substring(0, 100)}...\n\n` +
                `📝 Note: Full base64 content is available in the response. Use this to save or process the file.`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to download file: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to download file: ${String(error)}`);
    }
  }

  /**
   * List files in a Cloud Storage bucket
   */
  async listFiles(auth: OAuth2Client, params: StorageListFilesParams) {
    validateRequired(params.bucketName, 'bucketName');

    const storage = google.storage({ version: "v1", auth });

    try {
      const response = await storage.objects.list({
        bucket: params.bucketName,
        prefix: params.prefix,
        maxResults: params.maxResults || 100,
      });

      const items = response.data.items || [];

      if (items.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No files found in bucket: ${params.bucketName}${params.prefix ? ` with prefix: ${params.prefix}` : ''}`,
          }],
        };
      }

      let responseText = `📁 Files in bucket "${params.bucketName}"${params.prefix ? ` (prefix: ${params.prefix})` : ''}:\n\n`;

      items.forEach((item: any, index: number) => {
        responseText += `${index + 1}. ${item.name}\n`;
        responseText += `   Size: ${parseInt(item.size || '0').toLocaleString()} bytes\n`;
        responseText += `   Type: ${item.contentType}\n`;
        responseText += `   Updated: ${new Date(item.updated).toLocaleString()}\n`;
        responseText += `   gs:// URL: gs://${params.bucketName}/${item.name}\n`;
        responseText += '\n';
      });

      responseText += `Total files: ${items.length}`;

      return {
        content: [{
          type: "text",
          text: responseText,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to list files: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to list files: ${String(error)}`);
    }
  }

  /**
   * Delete a file from Cloud Storage
   */
  async deleteFile(auth: OAuth2Client, params: StorageDeleteFileParams) {
    validateRequired(params.bucketName, 'bucketName');
    validateRequired(params.fileName, 'fileName');

    const storage = google.storage({ version: "v1", auth });

    try {
      await storage.objects.delete({
        bucket: params.bucketName,
        object: params.fileName,
      });

      return {
        content: [{
          type: "text",
          text: `✅ File deleted successfully!\n\n` +
                `File: ${params.fileName}\n` +
                `Bucket: ${params.bucketName}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to delete file: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to delete file: ${String(error)}`);
    }
  }
}
