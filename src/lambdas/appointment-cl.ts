import { SQSEvent } from 'aws-lambda';
import { saveToRDS } from '../utils/rds';
import { publishCompletedEvent } from '../utils/eventbridge';
import { parseSNSMessage, EventPayload } from '../events/types';
import { withBatchEventHandler } from '../utils/lambda-wrapper';

export const handler = async (event: SQSEvent): Promise<void> => {
  const processRecord = withBatchEventHandler(async (record, logger) => {
    const appointment: EventPayload<'appointment.created'> = parseSNSMessage(record.body);

    logger.info('[CL] Processing appointment', {
      appointmentId: appointment.appointmentId,
      insuredId: appointment.insuredId,
      countryISO: appointment.countryISO,
    });

    // Guardar en RDS de Chile
    await saveToRDS(appointment, 'CL');

    logger.info('[CL] Appointment saved to RDS', {
      appointmentId: appointment.appointmentId,
    });

    await publishCompletedEvent({
      appointmentId: appointment.appointmentId,
      insuredId: appointment.insuredId,
      scheduleId: appointment.scheduleId,
      countryISO: appointment.countryISO,
      timestamp: new Date().toISOString(),
    });

    logger.info('[CL] Completion event published', {
      appointmentId: appointment.appointmentId,
    });

    return { success: true };
  }, { eventSource: 'CL_PROCESSOR' });

  await processRecord(event.Records);
};
