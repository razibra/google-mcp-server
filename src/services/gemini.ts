import { GoogleGenerativeAI } from "@google/generative-ai";
import { OAuth2Client } from "google-auth-library";
import {
  GeminiGenerateParams,
  GeminiChatParams,
  GeminiVisionParams,
  GoogleAPIError
} from "../types.js";
import { validateRequired } from "../utils/validation.js";

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  private async getGenAI(auth: OAuth2Client): Promise<GoogleGenerativeAI> {
    if (!this.genAI) {
      // Get API key from environment or use OAuth token
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) {
        throw new GoogleAPIError("GOOGLE_AI_API_KEY environment variable is required for Gemini API");
      }
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
    return this.genAI;
  }

  async generate(auth: OAuth2Client, params: GeminiGenerateParams) {
    validateRequired(params.prompt, 'prompt');

    try {
      const genAI = await this.getGenAI(auth);
      const model = genAI.getGenerativeModel({
        model: params.model || "gemini-2.5-pro-latest",
        generationConfig: {
          temperature: params.temperature ?? 1,
          maxOutputTokens: params.maxTokens,
        }
      });

      const result = await model.generateContent(params.prompt);
      const response = result.response;
      const text = response.text();

      return {
        content: [{
          type: "text",
          text: `Gemini Response:\n\n${text}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to generate with Gemini: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to generate with Gemini: ${String(error)}`);
    }
  }

  async chat(auth: OAuth2Client, params: GeminiChatParams) {
    if (!params.messages || params.messages.length === 0) {
      throw new GoogleAPIError('messages array is required and cannot be empty');
    }

    try {
      const genAI = await this.getGenAI(auth);
      const model = genAI.getGenerativeModel({
        model: params.model || "gemini-2.5-pro-latest",
        generationConfig: {
          temperature: params.temperature ?? 1,
        }
      });

      // Convert messages to Gemini format
      const history = params.messages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      const chat = model.startChat({ history });

      // Get the last message (should be from user)
      const lastMessage = params.messages[params.messages.length - 1];
      if (lastMessage.role !== 'user') {
        throw new GoogleAPIError('Last message must be from user');
      }

      const result = await chat.sendMessage(lastMessage.content);
      const response = result.response;
      const text = response.text();

      return {
        content: [{
          type: "text",
          text: `Gemini Response:\n\n${text}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to chat with Gemini: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to chat with Gemini: ${String(error)}`);
    }
  }

  async vision(auth: OAuth2Client, params: GeminiVisionParams) {
    validateRequired(params.prompt, 'prompt');

    if (!params.imageUrl && !params.imageData) {
      throw new GoogleAPIError('Either imageUrl or imageData is required');
    }

    try {
      const genAI = await this.getGenAI(auth);
      const model = genAI.getGenerativeModel({
        model: params.model || "gemini-2.5-pro-latest",
      });

      let imagePart;

      if (params.imageData) {
        // Base64 encoded image
        const [mimeType, data] = params.imageData.includes(',')
          ? params.imageData.split(',')
          : ['image/jpeg', params.imageData];

        imagePart = {
          inlineData: {
            data: data,
            mimeType: mimeType.replace('data:', '').replace(';base64', '') || 'image/jpeg',
          },
        };
      } else if (params.imageUrl) {
        // Fetch image from URL
        const response = await fetch(params.imageUrl);
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');

        imagePart = {
          inlineData: {
            data: base64,
            mimeType: response.headers.get('content-type') || 'image/jpeg',
          },
        };
      }

      const result = await model.generateContent([params.prompt, imagePart!]);
      const responseText = result.response.text();

      return {
        content: [{
          type: "text",
          text: `Gemini Vision Analysis:\n\n${responseText}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to analyze image with Gemini: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to analyze image with Gemini: ${String(error)}`);
    }
  }
}
