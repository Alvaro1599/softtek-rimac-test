import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { withApiHandler } from '../utils/lambda-wrapper';
import { createAppointmentService } from '../services/factories';
import { parseBody } from '../utils/validators';
import { successResponse, acceptedResponse } from '../utils/response';
import { MethodNotAllowedError } from '../errors';
import { CreateAppointmentInput } from '../events/types';
import { Logger } from '../utils/logger';

export const handler = withApiHandler(async (event, logger) => {
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path;

  const service = createAppointmentService(logger);

  if (method === 'POST') {
    return await handleCreateAppointment(event, service, logger);
  }

  if (method === 'GET') {
    // GET /insured/{insuredId}/appointments - all appointments for insured
    if (path.includes('/insured/')) {
      return await handleGetAppointments(event, service, logger);
    }
    // GET /appointments/{appointmentId} - single appointment
    return await handleGetAppointmentById(event, service, logger);
  }

  throw new MethodNotAllowedError(['GET', 'POST']);
});

async function handleCreateAppointment(
  event: APIGatewayProxyEventV2,
  service: ReturnType<typeof createAppointmentService>,
  logger: Logger
) {
  const input = parseBody<CreateAppointmentInput>(event.body);
  const result = await service.createAppointment(input);

  return acceptedResponse(result, {
    requestId: event.requestContext.requestId,
  });
}

async function handleGetAppointments(
  event: APIGatewayProxyEventV2,
  service: ReturnType<typeof createAppointmentService>,
  logger: Logger
) {
  const insuredId = event.pathParameters?.insuredId;
  const result = await service.getAppointmentsByInsuredId(insuredId);

  return successResponse(result, 200, {
    requestId: event.requestContext.requestId,
  });
}

async function handleGetAppointmentById(
  event: APIGatewayProxyEventV2,
  service: ReturnType<typeof createAppointmentService>,
  logger: Logger
) {
  const appointmentId = event.pathParameters?.appointmentId;
  const result = await service.getAppointmentById(appointmentId);

  return successResponse(result, 200, {
    requestId: event.requestContext.requestId,
  });
}
