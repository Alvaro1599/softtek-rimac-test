import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { withApiHandler } from '../utils/lambda-wrapper';
import { successResponse } from '../utils/response';
import { MethodNotAllowedError } from '../errors';

export const handler = withApiHandler(async (event) => {
  const method = event.requestContext.http.method;

  if (method !== 'GET') {
    throw new MethodNotAllowedError(['GET']);
  }

  return successResponse(
    {
      status: 'ok',
      service: 'medical-appointment-system',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
    200,
    {
      requestId: event.requestContext.requestId,
    }
  );
});
