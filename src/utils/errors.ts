import { GoogleAPIError } from "../types.js";

/**
 * Enhanced error messages with actionable suggestions
 */

export interface ErrorContext {
  service: string;
  operation: string;
  statusCode?: number;
  originalError?: unknown;
}

export interface ErrorSuggestion {
  title: string;
  steps: string[];
  docsUrl?: string;
}

/**
 * Create enhanced error message with actionable suggestions
 */
export function createEnhancedError(
  message: string,
  context: ErrorContext,
  suggestions?: ErrorSuggestion[]
): GoogleAPIError {
  let enhancedMessage = `❌ ${context.service} Error: ${message}\n\n`;

  enhancedMessage += `📍 Operation: ${context.operation}\n`;

  if (context.statusCode) {
    enhancedMessage += `📊 Status Code: ${context.statusCode}\n`;
  }

  if (suggestions && suggestions.length > 0) {
    enhancedMessage += `\n💡 Suggested Solutions:\n\n`;
    suggestions.forEach((suggestion, idx) => {
      enhancedMessage += `${idx + 1}. ${suggestion.title}\n`;
      suggestion.steps.forEach(step => {
        enhancedMessage += `   • ${step}\n`;
      });
      if (suggestion.docsUrl) {
        enhancedMessage += `   📖 Learn more: ${suggestion.docsUrl}\n`;
      }
      enhancedMessage += '\n';
    });
  }

  return new GoogleAPIError(
    enhancedMessage,
    context.statusCode,
    context.originalError
  );
}

/**
 * Common error suggestions by status code
 */
export function getErrorSuggestions(statusCode: number, service: string): ErrorSuggestion[] {
  const suggestions: ErrorSuggestion[] = [];

  switch (statusCode) {
    case 400:
      suggestions.push({
        title: "Invalid Request",
        steps: [
          "Check that all required parameters are provided",
          "Verify parameter formats (dates, emails, etc.)",
          "Review the API documentation for this operation",
        ],
      });
      break;

    case 401:
      suggestions.push({
        title: "Authentication Required",
        steps: [
          "Run authentication: Close and reopen Claude Desktop",
          "Check that credentials.json is in the correct location",
          "Verify OAuth2 scopes are properly configured",
          "Delete tokens.json and re-authenticate if needed",
        ],
        docsUrl: "https://console.cloud.google.com/apis/credentials",
      });
      break;

    case 403:
      if (service.includes("Imagen") || service.includes("Veo")) {
        suggestions.push({
          title: "API Access Not Available",
          steps: [
            "Ensure Vertex AI API is enabled in your Google Cloud project",
            `${service} may require special access or allowlist`,
            "Check IAM permissions - you need 'Vertex AI User' role",
            "Verify billing is enabled on your Google Cloud project",
          ],
          docsUrl: "https://console.cloud.google.com/vertex-ai",
        });
      } else {
        suggestions.push({
          title: "Permission Denied",
          steps: [
            `Enable the ${service} API in Google Cloud Console`,
            "Check OAuth2 scopes include necessary permissions",
            "Verify your Google account has access to the resource",
            "Check IAM roles and permissions in your project",
          ],
          docsUrl: "https://console.cloud.google.com/apis/library",
        });
      }
      break;

    case 404:
      suggestions.push({
        title: "Resource Not Found",
        steps: [
          "Verify the resource ID or name is correct",
          "Check that the resource exists in your account",
          "Ensure you're searching in the correct location/folder",
          `Confirm the ${service} API endpoint is correct`,
        ],
      });
      break;

    case 429:
      suggestions.push({
        title: "Rate Limit Exceeded",
        steps: [
          "Wait a few moments before retrying (automatic retry enabled)",
          "Consider implementing request batching for bulk operations",
          "Check your API quota in Google Cloud Console",
          "Request quota increase if needed for your use case",
        ],
        docsUrl: "https://console.cloud.google.com/apis/dashboard",
      });
      break;

    case 500:
    case 502:
    case 503:
    case 504:
      suggestions.push({
        title: "Server Error - Temporary Issue",
        steps: [
          "This is a temporary Google server error",
          "The request will be automatically retried",
          "If the issue persists, check Google Cloud Status Dashboard",
          "Wait a few minutes and try again",
        ],
        docsUrl: "https://status.cloud.google.com/",
      });
      break;
  }

  return suggestions;
}

/**
 * Create authentication error with helpful suggestions
 */
export function createAuthError(message: string, originalError?: unknown): GoogleAPIError {
  return createEnhancedError(
    message,
    {
      service: "Authentication",
      operation: "OAuth2",
      originalError,
    },
    [
      {
        title: "Re-authenticate",
        steps: [
          "Close Claude Desktop completely",
          "Delete tokens.json from the project folder",
          "Reopen Claude Desktop",
          "Browser will open - complete Google OAuth flow",
        ],
      },
      {
        title: "Check Credentials",
        steps: [
          "Ensure credentials.json exists in project root",
          "Verify it contains valid OAuth2 client credentials",
          "Download new credentials from Google Cloud Console if needed",
        ],
        docsUrl: "https://console.cloud.google.com/apis/credentials",
      },
    ]
  );
}

/**
 * Create API not enabled error with helpful suggestions
 */
export function createAPINotEnabledError(apiName: string, projectId: string): GoogleAPIError {
  return createEnhancedError(
    `${apiName} is not enabled`,
    {
      service: apiName,
      operation: "API Access",
      statusCode: 403,
    },
    [
      {
        title: `Enable ${apiName}`,
        steps: [
          `Go to Google Cloud Console API Library`,
          `Search for "${apiName}"`,
          `Click "Enable" button`,
          `Wait a few moments for activation`,
          `Retry your request`,
        ],
        docsUrl: `https://console.cloud.google.com/apis/library?project=${projectId}`,
      },
    ]
  );
}

/**
 * Create configuration error with helpful suggestions
 */
export function createConfigError(
  missingConfig: string,
  where: string
): GoogleAPIError {
  let steps: string[] = [];
  let docsUrl: string | undefined;

  if (missingConfig === "GOOGLE_AI_API_KEY") {
    steps = [
      "Go to Google AI Studio: https://makersuite.google.com/app/apikey",
      "Click 'Create API Key'",
      "Copy the key",
      "Add to .env file: GOOGLE_AI_API_KEY=your-key-here",
      "Restart Claude Desktop",
    ];
    docsUrl = "https://makersuite.google.com/app/apikey";
  } else if (missingConfig === "GOOGLE_CLOUD_PROJECT") {
    steps = [
      "Go to Google Cloud Console",
      "Select or create a project",
      "Copy the Project ID (not the name!)",
      "Add to .env file: GOOGLE_CLOUD_PROJECT=your-project-id",
      "Restart Claude Desktop",
    ];
    docsUrl = "https://console.cloud.google.com";
  } else if (missingConfig === "credentials.json") {
    steps = [
      "Go to Google Cloud Console > APIs & Services > Credentials",
      "Create OAuth 2.0 Client ID (Desktop app)",
      "Download the JSON file",
      "Save as 'credentials.json' in project root",
      "Restart Claude Desktop",
    ];
    docsUrl = "https://console.cloud.google.com/apis/credentials";
  }

  return createEnhancedError(
    `Missing configuration: ${missingConfig}`,
    {
      service: "Configuration",
      operation: where,
    },
    [
      {
        title: `Set up ${missingConfig}`,
        steps,
        docsUrl,
      },
    ]
  );
}

/**
 * Create quota exceeded error with helpful suggestions
 */
export function createQuotaError(service: string, quotaType: string): GoogleAPIError {
  return createEnhancedError(
    `Quota exceeded for ${quotaType}`,
    {
      service,
      operation: "API Request",
      statusCode: 429,
    },
    [
      {
        title: "Wait and Retry",
        steps: [
          "Requests are automatically retried with backoff",
          "Wait a few minutes before making more requests",
          "Consider spreading requests over time",
        ],
      },
      {
        title: "Check and Increase Quota",
        steps: [
          "Go to Google Cloud Console > IAM & Admin > Quotas",
          `Search for "${service}"`,
          "Review current usage and limits",
          "Request quota increase if needed",
        ],
        docsUrl: "https://console.cloud.google.com/iam-admin/quotas",
      },
    ]
  );
}
