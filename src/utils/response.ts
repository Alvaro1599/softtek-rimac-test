import { APIGatewayProxyResultV2 } from 'aws-lambda';

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  metadata?: {
    requestId?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    requestId?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

export function successResponse<T>(
  data: T,
  statusCode: number = 200,
  metadata?: Record<string, any>
): APIGatewayProxyResultV2 {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (metadata) {
    response.metadata = {
      timestamp: new Date().toISOString(),
      ...metadata,
    };
  }

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(response),
  };
}

export function errorResponse(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any,
  metadata?: Record<string, any>
): APIGatewayProxyResultV2 {
  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  if (metadata) {
    response.metadata = {
      timestamp: new Date().toISOString(),
      ...metadata,
    };
  }

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(response),
  };
}

export function createdResponse<T>(
  data: T,
  metadata?: Record<string, any>
): APIGatewayProxyResultV2 {
  return successResponse(data, 201, metadata);
}

export function acceptedResponse<T>(
  data: T,
  metadata?: Record<string, any>
): APIGatewayProxyResultV2 {
  return successResponse(data, 202, metadata);
}

export function noContentResponse(): APIGatewayProxyResultV2 {
  return {
    statusCode: 204,
    headers: {
      'Content-Type': 'application/json',
    },
    body: '',
  };
}

export function validationErrorResponse(
  message: string,
  details?: any,
  metadata?: Record<string, any>
): APIGatewayProxyResultV2 {
  return errorResponse('VALIDATION_ERROR', message, 400, details, metadata);
}

export function notFoundResponse(
  message: string = 'Resource not found',
  metadata?: Record<string, any>
): APIGatewayProxyResultV2 {
  return errorResponse('NOT_FOUND', message, 404, undefined, metadata);
}

export function conflictResponse(
  message: string,
  details?: any,
  metadata?: Record<string, any>
): APIGatewayProxyResultV2 {
  return errorResponse('CONFLICT', message, 409, details, metadata);
}

export function methodNotAllowedResponse(
  allowedMethods?: string[],
  metadata?: Record<string, any>
): APIGatewayProxyResultV2 {
  return errorResponse(
    'METHOD_NOT_ALLOWED',
    'HTTP method not allowed',
    405,
    allowedMethods ? { allowedMethods } : undefined,
    metadata
  );
}

export function internalErrorResponse(
  message: string = 'Internal server error',
  details?: any,
  metadata?: Record<string, any>
): APIGatewayProxyResultV2 {
  return errorResponse('INTERNAL_ERROR', message, 500, details, metadata);
}
