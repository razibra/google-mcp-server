import { OAuth2Client } from "google-auth-library";

export interface ServiceStatus {
  service: string;
  status: "healthy" | "degraded" | "unavailable";
  message: string;
  details?: string;
}

export interface HealthCheckResult {
  overall: "healthy" | "degraded" | "unavailable";
  timestamp: string;
  services: ServiceStatus[];
}

/**
 * Perform health check on all Google services
 */
export async function performHealthCheck(auth: OAuth2Client): Promise<HealthCheckResult> {
  const services: ServiceStatus[] = [];

  // Check authentication
  services.push(await checkAuth(auth));

  // Check environment configuration
  services.push(checkEnvConfig());

  // Check Google Cloud Project
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (projectId) {
    services.push(await checkVertexAI(auth, projectId));
  }

  // Check Gemini AI API
  services.push(checkGeminiAPI());

  // Determine overall status
  const hasUnavailable = services.some(s => s.status === "unavailable");
  const hasDegraded = services.some(s => s.status === "degraded");

  let overall: "healthy" | "degraded" | "unavailable";
  if (hasUnavailable) {
    overall = "unavailable";
  } else if (hasDegraded) {
    overall = "degraded";
  } else {
    overall = "healthy";
  }

  return {
    overall,
    timestamp: new Date().toISOString(),
    services,
  };
}

/**
 * Check authentication status
 */
async function checkAuth(auth: OAuth2Client): Promise<ServiceStatus> {
  try {
    const { token } = await auth.getAccessToken();
    if (!token) {
      return {
        service: "OAuth2 Authentication",
        status: "unavailable",
        message: "No access token available",
        details: "Run authentication flow by restarting Claude Desktop",
      };
    }

    // Check if token is expired or about to expire
    const credentials = auth.credentials;
    if (credentials.expiry_date) {
      const expiryTime = credentials.expiry_date;
      const now = Date.now();
      const timeUntilExpiry = expiryTime - now;

      if (timeUntilExpiry < 0) {
        return {
          service: "OAuth2 Authentication",
          status: "degraded",
          message: "Access token expired (will auto-refresh)",
          details: "Token will be automatically refreshed on next request",
        };
      } else if (timeUntilExpiry < 5 * 60 * 1000) { // Less than 5 minutes
        return {
          service: "OAuth2 Authentication",
          status: "degraded",
          message: "Access token expires soon",
          details: `Expires in ${Math.floor(timeUntilExpiry / 60000)} minutes`,
        };
      }
    }

    return {
      service: "OAuth2 Authentication",
      status: "healthy",
      message: "Authenticated successfully",
      details: "Access token is valid",
    };
  } catch (error) {
    return {
      service: "OAuth2 Authentication",
      status: "unavailable",
      message: "Authentication failed",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check environment configuration
 */
function checkEnvConfig(): ServiceStatus {
  const issues: string[] = [];

  if (!process.env.GOOGLE_AI_API_KEY) {
    issues.push("GOOGLE_AI_API_KEY not set (required for Gemini, Imagen, Veo)");
  }

  if (!process.env.GOOGLE_CLOUD_PROJECT) {
    issues.push("GOOGLE_CLOUD_PROJECT not set (required for Vertex AI services)");
  }

  if (issues.length === 0) {
    return {
      service: "Environment Configuration",
      status: "healthy",
      message: "All required environment variables are set",
    };
  } else if (issues.length === 1) {
    return {
      service: "Environment Configuration",
      status: "degraded",
      message: "Some services may be unavailable",
      details: issues.join(", "),
    };
  } else {
    return {
      service: "Environment Configuration",
      status: "unavailable",
      message: "Multiple configuration issues",
      details: issues.join("; "),
    };
  }
}

/**
 * Check Vertex AI availability
 */
async function checkVertexAI(auth: OAuth2Client, projectId: string): Promise<ServiceStatus> {
  try {
    const { token } = await auth.getAccessToken();
    if (!token) {
      return {
        service: "Vertex AI",
        status: "unavailable",
        message: "No authentication token",
      };
    }

    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (response.ok) {
      return {
        service: "Vertex AI",
        status: "healthy",
        message: "Vertex AI is accessible",
        details: "Imagen and Veo models may be available",
      };
    } else if (response.status === 403) {
      return {
        service: "Vertex AI",
        status: "degraded",
        message: "Vertex AI API not enabled or no permissions",
        details: "Enable Vertex AI API in Google Cloud Console",
      };
    } else {
      return {
        service: "Vertex AI",
        status: "degraded",
        message: `HTTP ${response.status}`,
        details: await response.text(),
      };
    }
  } catch (error) {
    return {
      service: "Vertex AI",
      status: "unavailable",
      message: "Cannot reach Vertex AI",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check Gemini AI API key
 */
function checkGeminiAPI(): ServiceStatus {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    return {
      service: "Gemini AI",
      status: "unavailable",
      message: "API key not configured",
      details: "Set GOOGLE_AI_API_KEY environment variable",
    };
  }

  // Basic validation
  if (!apiKey.startsWith("AIzaSy") || apiKey.length < 30) {
    return {
      service: "Gemini AI",
      status: "degraded",
      message: "API key format may be invalid",
      details: "Gemini API keys typically start with 'AIzaSy'",
    };
  }

  return {
    service: "Gemini AI",
    status: "healthy",
    message: "API key is configured",
    details: "Key format appears valid",
  };
}

/**
 * Format health check result as readable text
 */
export function formatHealthCheck(result: HealthCheckResult): string {
  const statusEmoji = {
    healthy: "✅",
    degraded: "⚠️",
    unavailable: "❌",
  };

  let output = `🏥 Health Check Report\n\n`;
  output += `Overall Status: ${statusEmoji[result.overall]} ${result.overall.toUpperCase()}\n`;
  output += `Timestamp: ${result.timestamp}\n\n`;
  output += `Services:\n`;

  result.services.forEach(service => {
    output += `\n${statusEmoji[service.status]} ${service.service}: ${service.status.toUpperCase()}\n`;
    output += `   ${service.message}\n`;
    if (service.details) {
      output += `   Details: ${service.details}\n`;
    }
  });

  return output;
}
