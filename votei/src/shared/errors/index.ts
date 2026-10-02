export abstract class BaseError extends Error {
  public abstract readonly code: string;
  public abstract readonly statusCode: number;

  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

export class DomainError extends BaseError {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    details?: unknown
  ) {
    super(message, details);
  }
}

export class AppError extends BaseError {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    details?: unknown
  ) {
    super(message, details);
  }
}

export class InsufficientCreditsError extends DomainError {
  constructor(message = 'Insufficient credits to perform this operation.') {
    super('QUOTA_EXCEEDED', message, 402);
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super('RESOURCE_NOT_FOUND', `${resource} '${id}' not found.`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied.') {
    super('FORBIDDEN', message, 403);
  }
}

export class ConfigurationError extends AppError {
  constructor(variable: string) {
    super('CONFIGURATION_ERROR', `Missing required environment variable: ${variable}`, 500);
  }
}

export class ExternalApiError extends AppError {
  constructor(service: string, message: string, details?: unknown) {
    super('EXTERNAL_API_ERROR', `${service} API failure: ${message}`, 502, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: unknown) {
    super('DATABASE_ERROR', `Database operation failed: ${message}`, 500, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = 'Content exceeds maximum permitted length.') {
    super('PAYLOAD_TOO_LARGE', message, 413);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.') {
    super('RATE_LIMITED', message, 429);
  }
}

export class ConflictError extends AppError {
  constructor(resource: string) {
    super('CONFLICT', `${resource} already exists.`, 409);
  }
}
