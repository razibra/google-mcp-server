import { GoogleAPIError } from "../types.js";

export interface RetryOptions {
  maxAttempts?: number;       // Default: 3
  initialDelay?: number;      // Default: 1000ms
  maxDelay?: number;          // Default: 10000ms
  backoffFactor?: number;     // Default: 2 (exponential backoff)
  retryableStatuses?: number[]; // HTTP status codes to retry
}

const DEFAULT_RETRYABLE_STATUSES = [
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
];

/**
 * Execute a function with automatic retry on transient failures
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryableStatuses = DEFAULT_RETRYABLE_STATUSES,
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Check if error is retryable
      const isRetryable = isErrorRetryable(error, retryableStatuses);

      if (!isRetryable) {
        // Non-retryable error, throw immediately
        throw error;
      }

      // Log retry attempt
      console.error(
        `Attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms...`,
        error instanceof Error ? error.message : String(error)
      );

      // Wait before retry
      await sleep(delay);

      // Exponential backoff
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  // All attempts failed
  throw new GoogleAPIError(
    `Operation failed after ${maxAttempts} attempts: ${lastError?.message || 'Unknown error'}`,
    undefined,
    lastError || undefined
  );
}

/**
 * Check if an error should be retried
 */
function isErrorRetryable(error: unknown, retryableStatuses: number[]): boolean {
  // Network errors (ECONNRESET, ETIMEDOUT, etc.)
  if (error instanceof Error) {
    const errorCode = (error as any).code;
    if (errorCode === 'ECONNRESET' ||
        errorCode === 'ETIMEDOUT' ||
        errorCode === 'ENOTFOUND' ||
        errorCode === 'ECONNREFUSED') {
      return true;
    }
  }

  // HTTP errors with retryable status codes
  if (error instanceof GoogleAPIError) {
    const statusCode = error.statusCode;
    if (statusCode && retryableStatuses.includes(statusCode)) {
      return true;
    }
  }

  // Fetch API errors
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as any).status;
    if (typeof status === 'number' && retryableStatuses.includes(status)) {
      return true;
    }
  }

  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper specifically for fetch requests
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, options);

    // Check if response status is retryable
    if (!response.ok && DEFAULT_RETRYABLE_STATUSES.includes(response.status)) {
      throw new GoogleAPIError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    return response;
  }, retryOptions);
}
