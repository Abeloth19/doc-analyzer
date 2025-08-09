export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

export class ValidationError extends APIError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = "Too many requests") {
    super(message, 429, "RATE_LIMIT_ERROR");
    this.name = "RateLimitError";
  }
}

export function handleAPIError(error: unknown): {
  message: string;
  statusCode: number;
} {
  if (error instanceof APIError) {
    return { message: error.message, statusCode: error.statusCode };
  }

 
  if (typeof error === "object" && error !== null) {
  
    if (
      "code" in error &&
      (error as { code?: unknown }).code === "ECONNABORTED"
    ) {
      return { message: "Request timeout", statusCode: 408 };
    }

    if (
      "response" in error &&
      typeof (error as { response?: unknown }).response === "object" &&
      (error as { response?: { status?: unknown } }).response?.status === 429
    ) {
      return {
        message: "Too many requests. Please try again later.",
        statusCode: 429,
      };
    }
  }

  return { message: "Internal server error", statusCode: 500 };
}
