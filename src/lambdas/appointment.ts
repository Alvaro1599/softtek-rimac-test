import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { AppointmentRecord } from '../types';
import { CreateAppointmentInput } from '../events/types';
import { saveAppointment, getAppointmentsByInsuredId } from '../utils/dynamodb';
import { publishToSNS } from '../utils/sns';
import { withApiHandler } from '../utils/lambda-wrapper';
import { successResponse, acceptedResponse, methodNotAllowedResponse } from '../utils/response';
import { parseBody, validateRequired, validateCountryISO, validateInsuredId } from '../utils/validators';
import { MethodNotAllowedError, MissingRequiredFieldError } from '../errors';
import { Logger } from '../utils/logger';

export const handler = withApiHandler(async (event, logger) => {
  const method = event.requestContext.http.method;

  // POST /appointments - Crear nueva cita
  if (method === 'POST') {
    return await createAppointment(event, logger);
  }

  // GET /appointments/{insuredId} - Obtener citas por asegurado
  if (method === 'GET') {
    return await getAppointments(event, logger);
  }

  throw new MethodNotAllowedError(['GET', 'POST']);
});

async function createAppointment(
  event: APIGatewayProxyEventV2,
  logger: Logger
): Promise<APIGatewayProxyResultV2> {
  // Parsear y validar el body
  const request = parseBody<CreateAppointmentInput>(event.body);

  validateRequired(request, ['insuredId', 'scheduleId', 'countryISO']);

  // Validar formato del país
  validateCountryISO(request.countryISO);

  // Validar formato del ID del asegurado
  validateInsuredId(request.insuredId);

  const appointmentId = randomUUID();
  const now = new Date().toISOString();

  logger.info('Creating appointment', {
    appointmentId,
    insuredId: request.insuredId,
    countryISO: request.countryISO,
  });

  const appointment: AppointmentRecord = {
    appointmentId,
    insuredId: request.insuredId,
    scheduleId: request.scheduleId,
    countryISO: request.countryISO,
    status: 'pending',
    createdAt: now,
  };

  await saveAppointment(appointment);

  logger.info('Appointment saved to DynamoDB', { appointmentId });

  await publishToSNS({
    appointmentId,
    insuredId: request.insuredId,
    scheduleId: request.scheduleId,
    countryISO: request.countryISO,
    timestamp: now,
  });

  logger.info('Appointment event published to SNS', { appointmentId });

  return acceptedResponse(
    {
      message: 'Appointment request is being processed',
      appointmentId,
      status: 'pending',
    },
    { requestId: event.requestContext.requestId }
  );
}

async function getAppointments(
  event: APIGatewayProxyEventV2,
  logger: Logger
): Promise<APIGatewayProxyResultV2> {
  const insuredId = event.pathParameters?.insuredId;

  if (!insuredId) {
    throw new MissingRequiredFieldError(['insuredId']);
  }

  logger.info('Fetching appointments', { insuredId });

  const appointments = await getAppointmentsByInsuredId(insuredId);

  logger.info('Appointments retrieved', {
    insuredId,
    count: appointments.length,
  });

  return successResponse(
    {
      insuredId,
      count: appointments.length,
      appointments,
    },
    200,
    { requestId: event.requestContext.requestId }
  );
}
