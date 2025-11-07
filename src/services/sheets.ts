import { google, sheets_v4 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import {
  CreateSpreadsheetParams,
  ReadSheetParams,
  WriteSheetParams,
  AppendSheetParams,
  UpdateSheetParams,
  GoogleAPIError
} from "../types.js";
import { validateRequired, validateId } from "../utils/validation.js";

export class SheetsService {
  async createSpreadsheet(auth: OAuth2Client, params: CreateSpreadsheetParams) {
    validateRequired(params.title, 'title');

    const sheets = google.sheets({ version: "v4", auth });

    try {
      const requestBody: sheets_v4.Schema$Spreadsheet = {
        properties: {
          title: params.title,
        },
      };

      if (params.sheetTitles && params.sheetTitles.length > 0) {
        requestBody.sheets = params.sheetTitles.map(title => ({
          properties: { title },
        }));
      }

      const result = await sheets.spreadsheets.create({
        requestBody,
      });

      return {
        content: [{
          type: "text",
          text: `Spreadsheet created successfully!\nTitle: ${result.data.properties?.title}\nSpreadsheet ID: ${result.data.spreadsheetId}\nURL: ${result.data.spreadsheetUrl}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to create spreadsheet: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to create spreadsheet: ${String(error)}`);
    }
  }

  async readSheet(auth: OAuth2Client, params: ReadSheetParams) {
    validateId(params.spreadsheetId, 'spreadsheetId');
    validateRequired(params.range, 'range');

    const sheets = google.sheets({ version: "v4", auth });

    try {
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId: params.spreadsheetId,
        range: params.range,
      });

      const values = result.data.values || [];

      if (values.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No data found in range: ${params.range}`,
          }],
        };
      }

      // Format as table
      const table = values
        .map((row, index) => {
          const rowNum = index + 1;
          const cells = row.map((cell, cellIndex) => `${cell || ""}`).join(" | ");
          return `Row ${rowNum}: ${cells}`;
        })
        .join("\n");

      return {
        content: [{
          type: "text",
          text: `Data from ${params.range}:\n\n${table}\n\nTotal rows: ${values.length}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to read sheet: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to read sheet: ${String(error)}`);
    }
  }

  async writeSheet(auth: OAuth2Client, params: WriteSheetParams) {
    validateId(params.spreadsheetId, 'spreadsheetId');
    validateRequired(params.range, 'range');

    if (!params.values || params.values.length === 0) {
      throw new GoogleAPIError('values array is required and cannot be empty');
    }

    const sheets = google.sheets({ version: "v4", auth });

    try {
      const result = await sheets.spreadsheets.values.update({
        spreadsheetId: params.spreadsheetId,
        range: params.range,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: params.values,
        },
      });

      return {
        content: [{
          type: "text",
          text: `Sheet updated successfully!\nRange: ${params.range}\nUpdated cells: ${result.data.updatedCells}\nUpdated rows: ${result.data.updatedRows}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to write to sheet: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to write to sheet: ${String(error)}`);
    }
  }

  async appendSheet(auth: OAuth2Client, params: AppendSheetParams) {
    validateId(params.spreadsheetId, 'spreadsheetId');
    validateRequired(params.range, 'range');

    if (!params.values || params.values.length === 0) {
      throw new GoogleAPIError('values array is required and cannot be empty');
    }

    const sheets = google.sheets({ version: "v4", auth });

    try {
      const result = await sheets.spreadsheets.values.append({
        spreadsheetId: params.spreadsheetId,
        range: params.range,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: params.values,
        },
      });

      return {
        content: [{
          type: "text",
          text: `Data appended successfully!\nRange: ${result.data.tableRange}\nUpdated cells: ${result.data.updates?.updatedCells}\nUpdated rows: ${result.data.updates?.updatedRows}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to append to sheet: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to append to sheet: ${String(error)}`);
    }
  }

  async updateSheet(auth: OAuth2Client, params: UpdateSheetParams) {
    // Same as writeSheet but kept for consistency
    return this.writeSheet(auth, params);
  }
}
