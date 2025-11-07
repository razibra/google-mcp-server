import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import {
  VisionAnalyzeParams,
  VisionOCRParams,
  VisionLabelParams,
  GoogleAPIError
} from "../types.js";

export class VisionService {
  async analyze(auth: OAuth2Client, params: VisionAnalyzeParams) {
    if (!params.imageUrl && !params.imageData) {
      throw new GoogleAPIError('Either imageUrl or imageData is required');
    }

    const vision = google.vision({ version: "v1", auth });

    try {
      const image: any = {};

      if (params.imageUrl) {
        image.source = { imageUri: params.imageUrl };
      } else if (params.imageData) {
        // Remove data URL prefix if present
        const base64Data = params.imageData.includes(',')
          ? params.imageData.split(',')[1]
          : params.imageData;
        image.content = base64Data;
      }

      const features = params.features?.map(type => ({ type })) || [
        { type: 'LABEL_DETECTION' },
        { type: 'TEXT_DETECTION' },
        { type: 'FACE_DETECTION' },
        { type: 'LANDMARK_DETECTION' },
      ];

      const result = await vision.images.annotate({
        requestBody: {
          requests: [{
            image,
            features,
          }],
        },
      });

      const annotations = result.data.responses?.[0];
      if (!annotations) {
        return {
          content: [{
            type: "text",
            text: "No annotations found in image.",
          }],
        };
      }

      let output = "Vision API Analysis:\n\n";

      if (annotations.labelAnnotations && annotations.labelAnnotations.length > 0) {
        output += "**Labels Detected:**\n";
        annotations.labelAnnotations.forEach((label) => {
          output += `- ${label.description} (confidence: ${(label.score! * 100).toFixed(1)}%)\n`;
        });
        output += "\n";
      }

      if (annotations.textAnnotations && annotations.textAnnotations.length > 0) {
        output += "**Text Detected (OCR):**\n";
        output += `${annotations.textAnnotations[0].description}\n\n`;
      }

      if (annotations.faceAnnotations && annotations.faceAnnotations.length > 0) {
        output += `**Faces Detected:** ${annotations.faceAnnotations.length}\n\n`;
      }

      if (annotations.landmarkAnnotations && annotations.landmarkAnnotations.length > 0) {
        output += "**Landmarks Detected:**\n";
        annotations.landmarkAnnotations.forEach((landmark) => {
          output += `- ${landmark.description}\n`;
        });
        output += "\n";
      }

      if (annotations.safeSearchAnnotation) {
        const safe = annotations.safeSearchAnnotation;
        output += "**Safe Search:**\n";
        output += `- Adult: ${safe.adult}\n`;
        output += `- Violence: ${safe.violence}\n`;
        output += `- Racy: ${safe.racy}\n\n`;
      }

      return {
        content: [{
          type: "text",
          text: output,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to analyze image: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to analyze image: ${String(error)}`);
    }
  }

  async ocr(auth: OAuth2Client, params: VisionOCRParams) {
    if (!params.imageUrl && !params.imageData) {
      throw new GoogleAPIError('Either imageUrl or imageData is required');
    }

    const vision = google.vision({ version: "v1", auth });

    try {
      const image: any = {};

      if (params.imageUrl) {
        image.source = { imageUri: params.imageUrl };
      } else if (params.imageData) {
        const base64Data = params.imageData.includes(',')
          ? params.imageData.split(',')[1]
          : params.imageData;
        image.content = base64Data;
      }

      const requestBody: any = {
        requests: [{
          image,
          features: [{ type: 'TEXT_DETECTION' }],
        }],
      };

      if (params.languageHints && params.languageHints.length > 0) {
        requestBody.requests[0].imageContext = {
          languageHints: params.languageHints,
        };
      }

      const result = await vision.images.annotate({ requestBody });

      const textAnnotations = result.data.responses?.[0]?.textAnnotations;

      if (!textAnnotations || textAnnotations.length === 0) {
        return {
          content: [{
            type: "text",
            text: "No text detected in image.",
          }],
        };
      }

      // First annotation contains all text
      const fullText = textAnnotations[0].description || "";

      return {
        content: [{
          type: "text",
          text: `Extracted Text (OCR):\n\n${fullText}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to perform OCR: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to perform OCR: ${String(error)}`);
    }
  }

  async detectLabels(auth: OAuth2Client, params: VisionLabelParams) {
    if (!params.imageUrl && !params.imageData) {
      throw new GoogleAPIError('Either imageUrl or imageData is required');
    }

    const vision = google.vision({ version: "v1", auth });

    try {
      const image: any = {};

      if (params.imageUrl) {
        image.source = { imageUri: params.imageUrl };
      } else if (params.imageData) {
        const base64Data = params.imageData.includes(',')
          ? params.imageData.split(',')[1]
          : params.imageData;
        image.content = base64Data;
      }

      const result = await vision.images.annotate({
        requestBody: {
          requests: [{
            image,
            features: [{
              type: 'LABEL_DETECTION',
              maxResults: params.maxResults || 10,
            }],
          }],
        },
      });

      const labels = result.data.responses?.[0]?.labelAnnotations;

      if (!labels || labels.length === 0) {
        return {
          content: [{
            type: "text",
            text: "No labels detected in image.",
          }],
        };
      }

      const labelList = labels
        .map((label) => `- ${label.description} (confidence: ${(label.score! * 100).toFixed(1)}%)`)
        .join("\n");

      return {
        content: [{
          type: "text",
          text: `Detected Labels:\n\n${labelList}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to detect labels: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to detect labels: ${String(error)}`);
    }
  }
}
