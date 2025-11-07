import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import {
  AppsScriptCreateProjectParams,
  AppsScriptUpdateContentParams,
  AppsScriptRunFunctionParams,
  AppsScriptGetDeploymentsParams,
  GoogleAPIError
} from "../types.js";
import { validateRequired } from "../utils/validation.js";

export class AppsScriptService {
  /**
   * Create a new Apps Script project
   */
  async createProject(auth: OAuth2Client, params: AppsScriptCreateProjectParams) {
    validateRequired(params.title, 'title');

    const script = google.script({ version: "v1", auth });

    try {
      const response = await script.projects.create({
        requestBody: {
          title: params.title,
          ...(params.parentId && { parentId: params.parentId }),
        },
      });

      const project = response.data;

      return {
        content: [{
          type: "text",
          text: `✅ Apps Script project created successfully!\n\n` +
                `Project ID: ${project.scriptId}\n` +
                `Title: ${project.title}\n` +
                `URL: https://script.google.com/d/${project.scriptId}/edit\n\n` +
                `You can now update the project content with apps_script_update_content.`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to create Apps Script project: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to create Apps Script project: ${String(error)}`);
    }
  }

  /**
   * Update Apps Script project content (files)
   */
  async updateContent(auth: OAuth2Client, params: AppsScriptUpdateContentParams) {
    validateRequired(params.scriptId, 'scriptId');

    if (!params.files || params.files.length === 0) {
      throw new GoogleAPIError('At least one file is required');
    }

    const script = google.script({ version: "v1", auth });

    try {
      // Get current project content
      const currentProject = await script.projects.getContent({
        scriptId: params.scriptId,
      });

      // Update with new files
      const response = await script.projects.updateContent({
        scriptId: params.scriptId,
        requestBody: {
          files: params.files.map(file => ({
            name: file.name,
            type: file.type,
            source: file.source,
          })),
          scriptId: params.scriptId,
        },
      });

      const filesCount = response.data.files?.length || 0;

      return {
        content: [{
          type: "text",
          text: `✅ Apps Script project updated successfully!\n\n` +
                `Project ID: ${params.scriptId}\n` +
                `Files updated: ${filesCount}\n` +
                `URL: https://script.google.com/d/${params.scriptId}/edit`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to update Apps Script content: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to update Apps Script content: ${String(error)}`);
    }
  }

  /**
   * Run a function in an Apps Script project
   */
  async runFunction(auth: OAuth2Client, params: AppsScriptRunFunctionParams) {
    validateRequired(params.scriptId, 'scriptId');
    validateRequired(params.functionName, 'functionName');

    const script = google.script({ version: "v1", auth });

    try {
      const response = await script.scripts.run({
        scriptId: params.scriptId,
        requestBody: {
          function: params.functionName,
          parameters: params.parameters || [],
          devMode: params.devMode || false,
        },
      });

      const result = response.data;

      if (result.error) {
        throw new GoogleAPIError(
          `Script execution error: ${result.error.message || 'Unknown error'}`,
          result.error.code || undefined,
          result.error
        );
      }

      let responseText = `✅ Function executed successfully!\n\n`;
      responseText += `Function: ${params.functionName}\n`;
      responseText += `Script ID: ${params.scriptId}\n\n`;

      if (result.response) {
        responseText += `Result:\n${JSON.stringify(result.response.result, null, 2)}`;
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
        throw new GoogleAPIError(`Failed to run Apps Script function: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to run Apps Script function: ${String(error)}`);
    }
  }

  /**
   * Get deployments for an Apps Script project
   */
  async getDeployments(auth: OAuth2Client, params: AppsScriptGetDeploymentsParams) {
    validateRequired(params.scriptId, 'scriptId');

    const script = google.script({ version: "v1", auth });

    try {
      const response = await script.projects.deployments.list({
        scriptId: params.scriptId,
      });

      const deployments = response.data.deployments || [];

      if (deployments.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No deployments found for script ID: ${params.scriptId}`,
          }],
        };
      }

      let responseText = `📦 Deployments for script ${params.scriptId}:\n\n`;

      deployments.forEach((deployment: any, index: number) => {
        responseText += `${index + 1}. ${deployment.deploymentConfig?.description || 'Unnamed deployment'}\n`;
        responseText += `   ID: ${deployment.deploymentId}\n`;
        responseText += `   Version: ${deployment.deploymentConfig?.versionNumber || 'HEAD'}\n`;
        if (deployment.entryPoints) {
          deployment.entryPoints.forEach((ep: any) => {
            if (ep.webApp) {
              responseText += `   Web App URL: ${ep.webApp.url}\n`;
            }
          });
        }
        responseText += '\n';
      });

      return {
        content: [{
          type: "text",
          text: responseText,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to get deployments: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to get deployments: ${String(error)}`);
    }
  }
}
