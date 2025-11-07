import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import {
  ImagenGenerateParams,
  ImagenEditParams,
  GoogleAPIError
} from "../types.js";
import { validateRequired } from "../utils/validation.js";

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

      // Create text summary
      let responseText = `✅ Generated ${images.length} image(s) with Imagen 3\n\n`;
      responseText += `Prompt: "${params.prompt}"\n`;
      responseText += `Model: ${model}\n`;
      responseText += `Aspect Ratio: ${aspectRatio}\n\n`;

      images.forEach((img: any, idx: number) => {
        responseText += `Image ${idx + 1}: data:${img.mimeType};base64,${img.data.substring(0, 50)}...\n`;
      });

      responseText += `\n📝 Note: Images are returned as base64-encoded strings. You can save them or display them in compatible interfaces.`;

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
