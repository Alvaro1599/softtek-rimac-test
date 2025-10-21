import { AppointmentService } from './AppointmentService';
import { AppointmentProcessor } from './AppointmentProcessor';
import { ScheduleService } from './ScheduleService';
import { AppointmentRepository } from '../repositories/AppointmentRepository';
import { EventRepository } from '../repositories/EventRepository';
import { RDSRepository } from '../repositories/RDSRepository';
import { getDynamoDBClient, getSNSClient, getEventBridgeClient } from '../repositories/connections';
import { Logger } from '../utils/logger';

export function createAppointmentService(logger: Logger): AppointmentService {
  const dynamoDb = getDynamoDBClient();
  const sns = getSNSClient();
  const eventBridge = getEventBridgeClient();

  const appointmentRepo = new AppointmentRepository(dynamoDb);
  const eventRepo = new EventRepository(sns, eventBridge);

  return new AppointmentService(appointmentRepo, eventRepo, logger);
}

export function createAppointmentProcessor(
  country: 'PE' | 'CL',
  logger: Logger
): AppointmentProcessor {
  const sns = getSNSClient();
  const eventBridge = getEventBridgeClient();

  const rdsRepo = new RDSRepository(country);
  const eventRepo = new EventRepository(sns, eventBridge);

  return new AppointmentProcessor(country, rdsRepo, eventRepo, logger);
}

export function createPEAppointmentProcessor(logger: Logger): AppointmentProcessor {
  return createAppointmentProcessor('PE', logger);
}

export function createCLAppointmentProcessor(logger: Logger): AppointmentProcessor {
  return createAppointmentProcessor('CL', logger);
}

export function createScheduleService(logger: Logger): ScheduleService {
  return new ScheduleService(logger);
}
