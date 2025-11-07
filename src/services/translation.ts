import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import {
  TranslateTextParams,
  DetectLanguageParams,
  ListLanguagesParams,
  GoogleAPIError
} from "../types.js";
import { validateRequired } from "../utils/validation.js";

export class TranslationService {
  async translate(auth: OAuth2Client, params: TranslateTextParams) {
    validateRequired(params.targetLanguage, 'targetLanguage');

    if (!params.text || (Array.isArray(params.text) && params.text.length === 0)) {
      throw new GoogleAPIError('text is required and cannot be empty');
    }

    const translate = google.translate({ version: "v2", auth });

    try {
      const textArray = Array.isArray(params.text) ? params.text : [params.text];

      const result = await translate.translations.list({
        q: textArray,
        target: params.targetLanguage,
        source: params.sourceLanguage,
      });

      const translations = result.data.translations || [];

      if (translations.length === 0) {
        return {
          content: [{
            type: "text",
            text: "No translations returned.",
          }],
        };
      }

      if (translations.length === 1) {
        const translation = translations[0];
        return {
          content: [{
            type: "text",
            text: `Translation (${params.sourceLanguage || 'auto'} → ${params.targetLanguage}):\n\n${translation.translatedText}${translation.detectedSourceLanguage ? `\n\nDetected Language: ${translation.detectedSourceLanguage}` : ''}`,
          }],
        };
      }

      // Multiple translations
      const output = translations
        .map((t, i) => `${i + 1}. ${t.translatedText}`)
        .join("\n");

      return {
        content: [{
          type: "text",
          text: `Translations (${params.sourceLanguage || 'auto'} → ${params.targetLanguage}):\n\n${output}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to translate text: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to translate text: ${String(error)}`);
    }
  }

  async detectLanguage(auth: OAuth2Client, params: DetectLanguageParams) {
    if (!params.text || (Array.isArray(params.text) && params.text.length === 0)) {
      throw new GoogleAPIError('text is required and cannot be empty');
    }

    const translate = google.translate({ version: "v2", auth });

    try {
      const textArray = Array.isArray(params.text) ? params.text : [params.text];

      const result = await translate.detections.list({
        q: textArray,
      });

      const detections = (result.data.detections || []) as any[][];

      if (detections.length === 0) {
        return {
          content: [{
            type: "text",
            text: "No language detected.",
          }],
        };
      }

      if (detections.length === 1 && detections[0].length > 0) {
        const detection = detections[0][0];
        return {
          content: [{
            type: "text",
            text: `Detected Language: ${detection.language}\nConfidence: ${(detection.confidence! * 100).toFixed(1)}%`,
          }],
        };
      }

      // Multiple detections
      const output = detections
        .map((detectionList, i) => {
          if (detectionList.length > 0) {
            const d = detectionList[0];
            return `${i + 1}. Language: ${d.language} (confidence: ${(d.confidence! * 100).toFixed(1)}%)`;
          }
          return `${i + 1}. No detection`;
        })
        .join("\n");

      return {
        content: [{
          type: "text",
          text: `Language Detections:\n\n${output}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to detect language: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to detect language: ${String(error)}`);
    }
  }

  async listLanguages(auth: OAuth2Client, params: ListLanguagesParams = {}) {
    const translate = google.translate({ version: "v2", auth });

    try {
      const result = await translate.languages.list({
        target: params.displayLanguageCode || 'en',
      });

      const languages = result.data.languages || [];

      if (languages.length === 0) {
        return {
          content: [{
            type: "text",
            text: "No languages found.",
          }],
        };
      }

      // Group by first letter for better organization
      const grouped = languages.reduce((acc: any, lang) => {
        const firstLetter = (lang.name || lang.language || '').charAt(0).toUpperCase();
        if (!acc[firstLetter]) acc[firstLetter] = [];
        acc[firstLetter].push(lang);
        return acc;
      }, {});

      let output = `Supported Languages (${languages.length} total):\n\n`;

      Object.keys(grouped).sort().forEach(letter => {
        output += `**${letter}**\n`;
        grouped[letter].forEach((lang: any) => {
          output += `- ${lang.name || lang.language} (${lang.language})\n`;
        });
        output += "\n";
      });

      return {
        content: [{
          type: "text",
          text: output,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to list languages: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to list languages: ${String(error)}`);
    }
  }
}
