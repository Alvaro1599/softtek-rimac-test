export class AppError extends Error {
  public readonly statusCode: number;
  public code: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, 500, 'INTERNAL_ERROR', details, false);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable', details?: any) {
    super(message, 503, 'SERVICE_UNAVAILABLE', details);
  }
}

export class MethodNotAllowedError extends AppError {
  constructor(allowedMethods?: string[]) {
    super(
      'HTTP method not allowed',
      405,
      'METHOD_NOT_ALLOWED',
      allowedMethods ? { allowedMethods } : undefined
    );
  }
}

export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

export class InvalidCountryCodeError extends ValidationError {
  constructor(countryCode: string) {
    super(
      'Invalid country code',
      { countryCode, allowedValues: ['PE', 'CL'] }
    );
    this.code = 'INVALID_COUNTRY_CODE';
  }
}

export class InvalidInsuredIdError extends ValidationError {
  constructor(insuredId: string) {
    super(
      'Invalid insured ID format',
      { insuredId, expectedFormat: '5-digit numeric string' }
    );
    this.code = 'INVALID_INSURED_ID';
  }
}

export class MissingRequiredFieldError extends ValidationError {
  constructor(fields: string[]) {
    super(
      'Missing required fields',
      { missingFields: fields }
    );
    this.code = 'MISSING_REQUIRED_FIELDS';
  }
}

export class AppointmentNotFoundError extends NotFoundError {
  constructor(appointmentId: string) {
    super('Appointment not found', { appointmentId });
    this.code = 'APPOINTMENT_NOT_FOUND';
  }
}

export class InvalidRequestBodyError extends ValidationError {
  constructor(error?: any) {
    super('Invalid request body format', { parseError: error });
    this.code = 'INVALID_REQUEST_BODY';
  }
}
