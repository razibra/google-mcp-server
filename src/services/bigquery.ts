import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import {
  BigQueryQueryParams,
  BigQueryCreateDatasetParams,
  BigQueryCreateTableParams,
  BigQueryInsertDataParams,
  BigQueryListTablesParams,
  GoogleAPIError
} from "../types.js";
import { validateRequired } from "../utils/validation.js";

export class BigQueryService {
  private projectId: string;

  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || "";
    if (!this.projectId) {
      console.warn("GOOGLE_CLOUD_PROJECT not set. BigQuery features will require project ID.");
    }
  }

  /**
   * Run a SQL query on BigQuery
   */
  async query(auth: OAuth2Client, params: BigQueryQueryParams) {
    validateRequired(params.query, 'query');

    if (!this.projectId) {
      throw new GoogleAPIError("GOOGLE_CLOUD_PROJECT environment variable is required for BigQuery");
    }

    const bigquery = google.bigquery({ version: "v2", auth });

    try {
      const response = await bigquery.jobs.query({
        projectId: this.projectId,
        requestBody: {
          query: params.query,
          useLegacySql: params.useLegacySql || false,
          maxResults: params.maxResults || 100,
          ...(params.datasetId && { defaultDataset: { datasetId: params.datasetId } }),
        },
      });

      const result = response.data;

      if (!result.schema || !result.rows || result.rows.length === 0) {
        return {
          content: [{
            type: "text",
            text: `Query executed successfully but returned no results.\n\n` +
                  `Total Rows: ${result.totalRows || 0}\n` +
                  `Job Complete: ${result.jobComplete}`,
          }],
        };
      }

      // Format results as table
      const fields = result.schema.fields || [];
      const rows = result.rows || [];

      let responseText = `✅ Query Results:\n\n`;
      responseText += `Total Rows: ${result.totalRows || rows.length}\n`;
      responseText += `Rows Returned: ${rows.length}\n\n`;

      // Header
      const headers = fields.map((f: any) => f.name).join(' | ');
      responseText += headers + '\n';
      responseText += '-'.repeat(headers.length) + '\n';

      // Rows
      rows.forEach((row: any) => {
        const values = (row.f || []).map((cell: any) => cell.v || 'null');
        responseText += values.join(' | ') + '\n';
      });

      return {
        content: [{
          type: "text",
          text: responseText,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to execute BigQuery query: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to execute BigQuery query: ${String(error)}`);
    }
  }

  /**
   * Create a new BigQuery dataset
   */
  async createDataset(auth: OAuth2Client, params: BigQueryCreateDatasetParams) {
    validateRequired(params.datasetId, 'datasetId');

    if (!this.projectId) {
      throw new GoogleAPIError("GOOGLE_CLOUD_PROJECT environment variable is required for BigQuery");
    }

    const bigquery = google.bigquery({ version: "v2", auth });

    try {
      const response = await bigquery.datasets.insert({
        projectId: this.projectId,
        requestBody: {
          datasetReference: {
            projectId: this.projectId,
            datasetId: params.datasetId,
          },
          description: params.description,
          location: params.location || "US",
        },
      });

      const dataset = response.data;

      return {
        content: [{
          type: "text",
          text: `✅ Dataset created successfully!\n\n` +
                `Dataset ID: ${dataset.datasetReference?.datasetId}\n` +
                `Project: ${dataset.datasetReference?.projectId}\n` +
                `Location: ${dataset.location}\n` +
                `Created: ${dataset.creationTime ? new Date(parseInt(dataset.creationTime)).toLocaleString() : 'N/A'}\n\n` +
                `Console URL: https://console.cloud.google.com/bigquery?project=${this.projectId}&d=${params.datasetId}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to create dataset: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to create dataset: ${String(error)}`);
    }
  }

  /**
   * Create a new BigQuery table
   */
  async createTable(auth: OAuth2Client, params: BigQueryCreateTableParams) {
    validateRequired(params.datasetId, 'datasetId');
    validateRequired(params.tableId, 'tableId');

    if (!params.schema || params.schema.length === 0) {
      throw new GoogleAPIError('Schema is required and must have at least one field');
    }

    if (!this.projectId) {
      throw new GoogleAPIError("GOOGLE_CLOUD_PROJECT environment variable is required for BigQuery");
    }

    const bigquery = google.bigquery({ version: "v2", auth });

    try {
      const response = await bigquery.tables.insert({
        projectId: this.projectId,
        datasetId: params.datasetId,
        requestBody: {
          tableReference: {
            projectId: this.projectId,
            datasetId: params.datasetId,
            tableId: params.tableId,
          },
          schema: {
            fields: params.schema.map(field => ({
              name: field.name,
              type: field.type,
              mode: field.mode || 'NULLABLE',
            })),
          },
          description: params.description,
        },
      });

      const table = response.data;

      let responseText = `✅ Table created successfully!\n\n`;
      responseText += `Table ID: ${table.tableReference?.tableId}\n`;
      responseText += `Dataset: ${table.tableReference?.datasetId}\n`;
      responseText += `Project: ${table.tableReference?.projectId}\n\n`;

      responseText += `Schema (${params.schema.length} fields):\n`;
      params.schema.forEach(field => {
        responseText += `  - ${field.name}: ${field.type} (${field.mode || 'NULLABLE'})\n`;
      });

      responseText += `\nConsole URL: https://console.cloud.google.com/bigquery?project=${this.projectId}&d=${params.datasetId}&t=${params.tableId}`;

      return {
        content: [{
          type: "text",
          text: responseText,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to create table: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to create table: ${String(error)}`);
    }
  }

  /**
   * Insert data into a BigQuery table
   */
  async insertData(auth: OAuth2Client, params: BigQueryInsertDataParams) {
    validateRequired(params.datasetId, 'datasetId');
    validateRequired(params.tableId, 'tableId');

    if (!params.rows || params.rows.length === 0) {
      throw new GoogleAPIError('At least one row is required');
    }

    if (!this.projectId) {
      throw new GoogleAPIError("GOOGLE_CLOUD_PROJECT environment variable is required for BigQuery");
    }

    const bigquery = google.bigquery({ version: "v2", auth });

    try {
      const response = await bigquery.tabledata.insertAll({
        projectId: this.projectId,
        datasetId: params.datasetId,
        tableId: params.tableId,
        requestBody: {
          rows: params.rows.map((row, index) => ({
            insertId: `row_${Date.now()}_${index}`,
            json: row,
          })),
        },
      });

      const result = response.data;

      if (result.insertErrors && result.insertErrors.length > 0) {
        const errorDetails = result.insertErrors.map((err: any) =>
          `Row ${err.index}: ${err.errors?.map((e: any) => e.message).join(', ')}`
        ).join('\n');

        throw new GoogleAPIError(`Failed to insert some rows:\n${errorDetails}`);
      }

      return {
        content: [{
          type: "text",
          text: `✅ Data inserted successfully!\n\n` +
                `Rows inserted: ${params.rows.length}\n` +
                `Table: ${params.datasetId}.${params.tableId}\n` +
                `Project: ${this.projectId}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof GoogleAPIError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to insert data: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to insert data: ${String(error)}`);
    }
  }

  /**
   * List tables in a BigQuery dataset
   */
  async listTables(auth: OAuth2Client, params: BigQueryListTablesParams) {
    validateRequired(params.datasetId, 'datasetId');

    if (!this.projectId) {
      throw new GoogleAPIError("GOOGLE_CLOUD_PROJECT environment variable is required for BigQuery");
    }

    const bigquery = google.bigquery({ version: "v2", auth });

    try {
      const response = await bigquery.tables.list({
        projectId: this.projectId,
        datasetId: params.datasetId,
        maxResults: params.maxResults || 50,
      });

      const tables = response.data.tables || [];

      if (tables.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No tables found in dataset: ${params.datasetId}`,
          }],
        };
      }

      let responseText = `📊 Tables in dataset "${params.datasetId}":\n\n`;

      tables.forEach((table: any, index: number) => {
        responseText += `${index + 1}. ${table.tableReference.tableId}\n`;
        responseText += `   Type: ${table.type}\n`;
        if (table.creationTime) {
          responseText += `   Created: ${new Date(parseInt(table.creationTime)).toLocaleString()}\n`;
        }
        responseText += `   URL: https://console.cloud.google.com/bigquery?project=${this.projectId}&d=${params.datasetId}&t=${table.tableReference.tableId}\n`;
        responseText += '\n';
      });

      responseText += `Total tables: ${tables.length}`;

      return {
        content: [{
          type: "text",
          text: responseText,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to list tables: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to list tables: ${String(error)}`);
    }
  }
}
