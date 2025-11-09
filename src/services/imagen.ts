import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import {
  ImagenGenerateParams,
  ImagenEditParams,
  GoogleAPIError
} from "../types.js";
import { validateRequired } from "../utils/validation.js";
import fs from "fs/promises";
import path from "path";
import os from "os";

export class ImagenService {
  private projectId: string;
  private location: string = "us-central1";

  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || "";
    if (!this.projectId) {
      console.warn("GOOGLE_CLOUD_PROJECT not set. Imagen features will require project ID.");
    }
  }

  /**
   * Save base64 image to file
   */
  private async saveImageToFile(base64Data: string, outputPath?: string): Promise<string> {
    try {
      // Determine output directory
      const homeDir = os.homedir();
      const defaultDir = path.join(homeDir, "Pictures", "AI-Generated");
      const outputDir = outputPath || defaultDir;

      // Create directory if it doesn't exist
      await fs.mkdir(outputDir, { recursive: true });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + Date.now();
      const filename = `imagen_${timestamp}.png`;
      const filePath = path.join(outputDir, filename);

      // Convert base64 to buffer and save
      const imageBuffer = Buffer.from(base64Data, 'base64');
      await fs.writeFile(filePath, imageBuffer);

      return filePath;
    } catch (error) {
      console.error('Error saving image to file:', error);
      throw new GoogleAPIError(`Failed to save image to file: ${error}`);
    }
  }

  /**
   * Generate images using Imagen 3
   */
  async generate(auth: OAuth2Client, params: ImagenGenerateParams) {
    validateRequired(params.prompt, 'prompt');

    if (!this.projectId) {
      throw new GoogleAPIError("GOOGLE_CLOUD_PROJECT environment variable is required for Imagen API");
    }

    try {
      const model = params.model || "imagen-3.0-generate-001";
      const numberOfImages = params.numberOfImages || 1;
      const aspectRatio = params.aspectRatio || "1:1";

      if (numberOfImages < 1 || numberOfImages > 4) {
        throw new GoogleAPIError("numberOfImages must be between 1 and 4");
      }

      // Vertex AI endpoint
      const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}:predict`;

      // Prepare request body
      const requestBody = {
        instances: [
          {
            prompt: params.prompt,
          }
        ],
        parameters: {
          sampleCount: numberOfImages,
          aspectRatio: aspectRatio,
          ...(params.negativePrompt && { negativePrompt: params.negativePrompt }),
          ...(params.safetyFilterLevel && { safetyFilterLevel: params.safetyFilterLevel }),
          ...(params.personGeneration && { personGeneration: params.personGeneration }),
        }
      };

      // Get access token
      const { token } = await auth.getAccessToken();
      if (!token) {
        throw new GoogleAPIError("Failed to get access token");
      }

      // Make request to Vertex AI
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new GoogleAPIError(`Imagen API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      // Extract generated images (base64)
      const predictions = result.predictions || [];
      if (predictions.length === 0) {
        throw new GoogleAPIError("No images were generated");
      }

      // Format response
      const images = predictions.map((pred: any, idx: number) => {
        const imageData = pred.bytesBase64Encoded || pred.image?.bytesBase64Encoded;
        return {
          index: idx + 1,
          mimeType: pred.mimeType || "image/png",
          data: imageData,
        };
      });

      // Save to file by default (unless explicitly disabled)
      const shouldSaveToFile = params.saveToFile !== false; // Default to true
      const savedFiles: string[] = [];

      if (shouldSaveToFile) {
        for (const img of images) {
          try {
            const filePath = await this.saveImageToFile(img.data, params.outputPath);
            savedFiles.push(filePath);
          } catch (error) {
            console.error('Failed to save image:', error);
          }
        }
      }

      // Create text summary
      let responseText = `✅ Generated ${images.length} image(s) with Imagen 3\n\n`;
      responseText += `Prompt: "${params.prompt}"\n`;
      responseText += `Model: ${model}\n`;
      responseText += `Aspect Ratio: ${aspectRatio}\n\n`;

      if (savedFiles.length > 0) {
        responseText += `📁 Saved Images:\n`;
        savedFiles.forEach((filePath, idx) => {
          responseText += `  ${idx + 1}. ${filePath}\n`;
        });
        responseText += `\n✅ You can now open these images from your file explorer!`;
      } else {
        images.forEach((img: any, idx: number) => {
          responseText += `Image ${idx + 1}: data:${img.mimeType};base64,${img.data.substring(0, 50)}...\n`;
        });
        responseText += `\n📝 Note: Images are returned as base64-encoded strings. Set saveToFile: true to save them automatically.`;
      }

      return {
        content: [{
          type: "text",
          text: responseText,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof GoogleAPIError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to generate images with Imagen: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to generate images with Imagen: ${String(error)}`);
    }
  }

  /**
   * Edit images using Imagen 3 (inpainting/outpainting)
   */
  async edit(auth: OAuth2Client, params: ImagenEditParams) {
    validateRequired(params.prompt, 'prompt');
    validateRequired(params.baseImage, 'baseImage');

    if (!this.projectId) {
      throw new GoogleAPIError("GOOGLE_CLOUD_PROJECT environment variable is required for Imagen API");
    }

    try {
      const model = "imagen-3.0-generate-001";
      const numberOfImages = params.numberOfImages || 1;

      // Vertex AI endpoint for editing
      const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}:predict`;

      const requestBody = {
        instances: [
          {
            prompt: params.prompt,
            image: {
              bytesBase64Encoded: params.baseImage,
            },
            ...(params.mask && {
              mask: {
                image: {
                  bytesBase64Encoded: params.mask,
                }
              }
            }),
          }
        ],
        parameters: {
          sampleCount: numberOfImages,
          mode: params.mask ? "inpainting" : "outpainting",
          ...(params.negativePrompt && { negativePrompt: params.negativePrompt }),
        }
      };

      const { token } = await auth.getAccessToken();
      if (!token) {
        throw new GoogleAPIError("Failed to get access token");
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new GoogleAPIError(`Imagen edit API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const predictions = result.predictions || [];

      if (predictions.length === 0) {
        throw new GoogleAPIError("No edited images were generated");
      }

      let responseText = `✅ Edited ${predictions.length} image(s) with Imagen 3\n\n`;
      responseText += `Prompt: "${params.prompt}"\n`;
      responseText += `Mode: ${params.mask ? 'Inpainting' : 'Outpainting'}\n\n`;

      predictions.forEach((pred: any, idx: number) => {
        const imageData = pred.bytesBase64Encoded || pred.image?.bytesBase64Encoded;
        responseText += `Edited Image ${idx + 1}: data:image/png;base64,${imageData.substring(0, 50)}...\n`;
      });

      return {
        content: [{
          type: "text",
          text: responseText,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof GoogleAPIError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to edit image with Imagen: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to edit image with Imagen: ${String(error)}`);
    }
  }
}
