import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, SQSRecord } from 'aws-lambda';
import { AppError, isOperationalError } from '../errors';
import { errorResponse, internalErrorResponse } from './response';
import { createRequestLogger, createEventLogger, Logger } from './logger';

type ApiHandler = (
  event: APIGatewayProxyEventV2,
  logger: Logger
) => Promise<APIGatewayProxyResultV2>;

type EventHandler<T = any> = (
  record: SQSRecord,
  logger: Logger
) => Promise<T>;

interface ApiHandlerOptions {
  logEvent?: boolean; // Si debe loggear el evento completo (default: false)
}

export function withApiHandler(
  handler: ApiHandler,
  options: ApiHandlerOptions = {}
): (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyResultV2> {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    const requestId = event.requestContext.requestId;
    const logger = createRequestLogger(requestId, {
      method: event.requestContext.http.method,
      path: event.rawPath,
    });

    try {
      if (options.logEvent) {
        logger.debug('Incoming request', { event });
      } else {
        logger.info('Processing request', {
          method: event.requestContext.http.method,
          path: event.rawPath,
        });
      }

      const result = await handler(event, logger);

      logger.info('Request completed successfully', {
        ...(typeof result === 'object' && 'statusCode' in result && { statusCode: result.statusCode }),
      });

      return result;
    } catch (error) {
      return handleApiError(error, logger, requestId);
    }
  };
}

function handleApiError(
  error: unknown,
  logger: Logger,
  requestId: string
): APIGatewayProxyResultV2 {
  if (error instanceof AppError) {
    logger.warn('Application error occurred', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    });

    return errorResponse(
      error.code,
      error.message,
      error.statusCode,
      error.details,
      { requestId }
    );
  }

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error('Unexpected error occurred', error instanceof Error ? error : new Error(String(error)), {
    stack: errorStack,
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const details = isProduction ? undefined : { error: errorMessage };

  return internalErrorResponse('Internal server error', details, { requestId });
}

interface EventHandlerOptions {
  logRecord?: boolean;
  eventSource?: string;
}

export function withEventHandler<T = any>(
  handler: EventHandler<T>,
  options: EventHandlerOptions = {}
): (record: SQSRecord, logger?: Logger) => Promise<T> {
  return async (record: SQSRecord, logger?: Logger): Promise<T> => {
    const eventLogger = logger || createEventLogger(options.eventSource || 'SQS', {
      messageId: record.messageId,
    });

    try {
      if (options.logRecord) {
        eventLogger.debug('Processing record', { record });
      } else {
        eventLogger.info('Processing event', {
          messageId: record.messageId,
        });
      }

      const result = await handler(record, eventLogger);

      eventLogger.info('Event processed successfully');

      return result;
    } catch (error) {
      handleEventError(error, eventLogger, record);
      throw error;
    }
  };
}

function handleEventError(error: unknown, logger: Logger, record: SQSRecord): void {
  // Error operacional esperado
  if (error instanceof AppError && isOperationalError(error)) {
    logger.warn('Operational error during event processing', {
      code: error.code,
      message: error.message,
      details: error.details,
      messageId: record.messageId,
    });
    return;
  }
  // Error crítico/inesperado
  logger.error(
    'Critical error during event processing',
    error instanceof Error ? error : new Error(String(error)),
    {
      messageId: record.messageId,
      eventSource: record.eventSource,
    }
  );
}

export function withBatchEventHandler<T = any>(
  handler: EventHandler<T>,
  options: EventHandlerOptions = {}
): (records: SQSRecord[]) => Promise<void> {
  return async (records: SQSRecord[]): Promise<void> => {
    const batchLogger = createEventLogger('SQS_BATCH', {
      recordCount: records.length,
    });

    batchLogger.info('Starting batch processing');

    const wrappedHandler = withEventHandler(handler, options);

    const results = await Promise.allSettled(
      records.map((record) => wrappedHandler(record, batchLogger.withContext({ messageId: record.messageId })))
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    if (failed > 0) {
      batchLogger.warn('Batch processing completed with errors', {
        total: records.length,
        succeeded,
        failed,
      });

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          batchLogger.error('Record processing failed', result.reason, {
            recordIndex: index,
            messageId: records[index].messageId,
          });
        }
      });

      throw new Error(`Batch processing failed: ${failed}/${records.length} records failed`);
    }

    batchLogger.info('Batch processing completed successfully', {
      total: records.length,
      succeeded,
    });
  };
}
