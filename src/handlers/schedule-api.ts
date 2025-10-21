import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { withApiHandler } from '../utils/lambda-wrapper';
import { createScheduleService } from '../services/factories';
import { successResponse } from '../utils/response';
import { MethodNotAllowedError } from '../errors';
import { Logger } from '../utils/logger';

export const handler = withApiHandler(async (event, logger) => {
  const method = event.requestContext.http.method;

  if (method !== 'GET') {
    throw new MethodNotAllowedError(['GET']);
  }

  return await handleGetAvailableSchedules(event, logger);
});

async function handleGetAvailableSchedules(
  event: APIGatewayProxyEventV2,
  logger: Logger
) {
  const service = createScheduleService(logger);

  const countryISO = event.queryStringParameters?.countryISO;
  const date = event.queryStringParameters?.date;
  const specialtyId = event.queryStringParameters?.specialtyId;

  const result = await service.getAvailableSchedules(countryISO, date, specialtyId);

  return successResponse(result, 200, {
    requestId: event.requestContext.requestId,
  });
}
