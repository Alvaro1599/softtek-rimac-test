import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { AppointmentRecord } from '../types';
import { CreateAppointmentInput } from '../events/types';
import { saveAppointment, getAppointmentsByInsuredId } from '../utils/dynamodb';
import { publishToSNS } from '../utils/sns';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // POST /appointments - Crear nueva cita
    if (event.requestContext.http.method === 'POST') {
      return await createAppointment(event);
    }

    // GET /appointments/{insuredId} - Obtener citas por asegurado
    if (event.requestContext.http.method === 'GET') {
      return await getAppointments(event);
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

async function createAppointment(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Missing request body' }),
    };
  }

  const request: CreateAppointmentInput = JSON.parse(event.body);

  if (!request.insuredId || !request.scheduleId || !request.countryISO) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Missing required fields: insuredId, scheduleId, countryISO' }),
    };
  }

  if (request.countryISO !== 'PE' && request.countryISO !== 'CL') {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'countryISO must be either PE or CL' }),
    };
  }

  if (!/^\d{5}$/.test(request.insuredId)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'insuredId must be a 5-digit string' }),
    };
  }

  const appointmentId = randomUUID();
  const now = new Date().toISOString();

  // Crear registro en DynamoDB con estado "pending"
  const appointment: AppointmentRecord = {
    appointmentId,
    insuredId: request.insuredId,
    scheduleId: request.scheduleId,
    countryISO: request.countryISO,
    status: 'pending',
    createdAt: now,
  };

  await saveAppointment(appointment);

  await publishToSNS({
    appointmentId,
    insuredId: request.insuredId,
    scheduleId: request.scheduleId,
    countryISO: request.countryISO,
    timestamp: now,
  });

  return {
    statusCode: 202,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Appointment request is being processed',
      appointmentId,
      status: 'pending',
    }),
  };
}

async function getAppointments(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const insuredId = event.pathParameters?.insuredId;

  if (!insuredId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Missing insuredId parameter' }),
    };
  }

  const appointments = await getAppointmentsByInsuredId(insuredId);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      insuredId,
      count: appointments.length,
      appointments,
    }),
  };
}
