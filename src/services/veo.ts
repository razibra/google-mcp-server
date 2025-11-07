import { OAuth2Client } from "google-auth-library";
import {
  VeoGenerateParams,
  GoogleAPIError
} from "../types.js";
import { validateRequired } from "../utils/validation.js";

export class VeoService {
  private projectId: string;
  private location: string = "us-central1";

  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || "";
    if (!this.projectId) {
      console.warn("GOOGLE_CLOUD_PROJECT not set. Veo features will require project ID.");
    }
  }

  /**
   * Generate videos using Veo 3
   * Note: Veo 3 API access may be limited. This is the implementation structure.
   */
  async generate(auth: OAuth2Client, params: VeoGenerateParams) {
    validateRequired(params.prompt, 'prompt');

    if (!this.projectId) {
      throw new GoogleAPIError("GOOGLE_CLOUD_PROJECT environment variable is required for Veo API");
    }

    try {
      const model = params.model || "veo-3.0";
      const duration = params.duration || 5;
      const aspectRatio = params.aspectRatio || "16:9";

      if (duration < 1 || duration > 30) {
        throw new GoogleAPIError("Video duration must be between 1 and 30 seconds");
      }

      // Vertex AI endpoint for Veo
      // Note: This endpoint may need adjustment based on actual Veo API availability
      const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}:predict`;

      const requestBody = {
        instances: [
          {
            prompt: params.prompt,
          }
        ],
        parameters: {
          duration: duration,
          aspectRatio: aspectRatio,
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

        // Check if access is not available
        if (response.status === 403 || response.status === 404) {
          throw new GoogleAPIError(
            `Veo 3 API access not available. Status: ${response.status}\n\n` +
            `Veo 3 is Google's latest video generation model and may require special access.\n` +
            `Please check:\n` +
            `1. Vertex AI API is enabled in your Google Cloud project\n` +
            `2. You have access to Veo 3 (may require allowlist)\n` +
            `3. The model name and endpoint are correct\n\n` +
            `Error: ${errorText}`
          );
        }

        throw new GoogleAPIError(`Veo API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      // Extract generated video
      const predictions = result.predictions || [];
      if (predictions.length === 0) {
        throw new GoogleAPIError("No video was generated");
      }

      const video = predictions[0];
      const videoData = video.bytesBase64Encoded || video.video?.bytesBase64Encoded;

      let responseText = `✅ Generated video with Veo 3\n\n`;
      responseText += `Prompt: "${params.prompt}"\n`;
      responseText += `Model: ${model}\n`;
      responseText += `Duration: ${duration} seconds\n`;
      responseText += `Aspect Ratio: ${aspectRatio}\n\n`;

      if (videoData) {
        responseText += `Video data: data:video/mp4;base64,${videoData.substring(0, 50)}...\n`;
        responseText += `\n📝 Note: Video is returned as base64-encoded MP4. You can save it to a file.`;
      } else if (video.videoUri) {
        responseText += `Video URL: ${video.videoUri}\n`;
        responseText += `\n📝 Note: Video is available at the provided URL.`;
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
        throw new GoogleAPIError(`Failed to generate video with Veo: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to generate video with Veo: ${String(error)}`);
    }
  }

  /**
   * Check if Veo API is available
   */
  async checkAvailability(auth: OAuth2Client) {
    if (!this.projectId) {
      return {
        content: [{
          type: "text",
          text: "❌ GOOGLE_CLOUD_PROJECT environment variable is not set.\nVeo 3 requires a Google Cloud project with Vertex AI enabled.",
        }],
      };
    }

    try {
      // Try to list available models
      const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models`;

      const { token } = await auth.getAccessToken();
      if (!token) {
        throw new GoogleAPIError("Failed to get access token");
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      let statusText = `📊 Veo 3 API Status Check\n\n`;
      statusText += `Project ID: ${this.projectId}\n`;
      statusText += `Location: ${this.location}\n`;
      statusText += `API Response: ${response.status} ${response.statusText}\n\n`;

      if (response.ok) {
        const data = await response.json();
        const models = data.models || [];
        const veoModels = models.filter((m: any) => m.name && m.name.includes('veo'));

        if (veoModels.length > 0) {
          statusText += `✅ Veo models found:\n`;
          veoModels.forEach((m: any) => {
            statusText += `  - ${m.displayName || m.name}\n`;
          });
        } else {
          statusText += `⚠️ No Veo models found in available models list.\n`;
          statusText += `Veo 3 may require special access or allowlist approval.\n`;
        }
      } else {
        statusText += `❌ Cannot access Vertex AI models.\n`;
        statusText += `Please ensure Vertex AI API is enabled in your project.\n`;
      }

      return {
        content: [{
          type: "text",
          text: statusText,
        }],
      };
    } catch (error: unknown) {
      return {
        content: [{
          type: "text",
          text: `❌ Error checking Veo availability: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  }
}
