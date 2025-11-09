import fs from "fs";
import path from "path";

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate configuration on server startup
 */
export function validateConfiguration(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check environment variables
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;

  if (!apiKey) {
    errors.push("GOOGLE_AI_API_KEY environment variable is not set");
    errors.push("  Required for: Gemini AI, Imagen 3, Veo 3");
    errors.push("  Get your key from: https://makersuite.google.com/app/apikey");
  } else if (!isValidApiKey(apiKey)) {
    warnings.push("GOOGLE_AI_API_KEY format may be invalid");
    warnings.push("  Gemini API keys typically start with 'AIzaSy' and are 39 characters long");
  }

  if (!projectId) {
    errors.push("GOOGLE_CLOUD_PROJECT environment variable is not set");
    errors.push("  Required for: Vertex AI services (Imagen, Veo), BigQuery, Cloud Storage");
    errors.push("  Find your project ID in: https://console.cloud.google.com/");
  } else if (!isValidProjectId(projectId)) {
    warnings.push("GOOGLE_CLOUD_PROJECT format may be invalid");
    warnings.push("  Project IDs should be lowercase alphanumeric with hyphens");
  }

  // Check for credentials.json
  const credentialsPath = path.join(process.cwd(), "credentials.json");
  if (!fs.existsSync(credentialsPath)) {
    errors.push("credentials.json file not found in project root");
    errors.push("  Required for: OAuth2 authentication (Gmail, Drive, Calendar, etc.)");
    errors.push("  Download from: https://console.cloud.google.com/apis/credentials");
  } else {
    // Validate credentials.json structure
    try {
      const credentialsContent = fs.readFileSync(credentialsPath, "utf-8");
      const credentials = JSON.parse(credentialsContent);

      if (!credentials.installed && !credentials.web) {
        warnings.push("credentials.json may have invalid structure");
        warnings.push("  Expected OAuth2 client credentials from Google Cloud Console");
      }
    } catch (error) {
      errors.push("credentials.json exists but cannot be parsed as valid JSON");
    }
  }

  // Check for .env file
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    warnings.push(".env file not found");
    warnings.push("  Consider creating .env for easier configuration management");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Gemini API key format
 */
function isValidApiKey(apiKey: string): boolean {
  // Gemini API keys typically start with "AIzaSy" and are 39 characters long
  return apiKey.startsWith("AIzaSy") && apiKey.length === 39;
}

/**
 * Validate Google Cloud Project ID format
 */
function isValidProjectId(projectId: string): boolean {
  // Project IDs must be 6-30 characters, lowercase letters, digits, hyphens
  // Must start with a letter
  const regex = /^[a-z][a-z0-9-]{5,29}$/;
  return regex.test(projectId);
}

/**
 * Format validation result as human-readable text
 */
export function formatValidationResult(result: ConfigValidationResult): string {
  let output = "";

  if (result.valid) {
    output += "✅ Configuration validation passed\n\n";
  } else {
    output += "❌ Configuration validation failed\n\n";
  }

  if (result.errors.length > 0) {
    output += "🚨 ERRORS (must be fixed):\n";
    result.errors.forEach(error => {
      output += `  ${error}\n`;
    });
    output += "\n";
  }

  if (result.warnings.length > 0) {
    output += "⚠️  WARNINGS (should be reviewed):\n";
    result.warnings.forEach(warning => {
      output += `  ${warning}\n`;
    });
    output += "\n";
  }

  if (!result.valid) {
    output += "Server will attempt to start, but some features may not work.\n";
    output += "Please fix the errors above and restart the server.\n";
  }

  return output;
}
