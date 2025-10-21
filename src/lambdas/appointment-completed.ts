import { SQSEvent } from 'aws-lambda';
import { updateAppointmentStatus } from '../utils/dynamodb';
import { EventPayload } from '../events/types';
import { withBatchEventHandler } from '../utils/lambda-wrapper';

export const handler = async (event: SQSEvent): Promise<void> => {
  const processRecord = withBatchEventHandler(async (record, logger) => {
    const eventBridgeMessage = JSON.parse(record.body);
    const completedEvent: EventPayload<'appointment.completed'> = eventBridgeMessage.detail;

    logger.info('[COMPLETED] Processing completed event', {
      appointmentId: completedEvent.appointmentId,
      insuredId: completedEvent.insuredId,
      countryISO: completedEvent.countryISO,
    });

    await updateAppointmentStatus(completedEvent.appointmentId, 'completed');

    logger.info('[COMPLETED] Appointment status updated to completed', {
      appointmentId: completedEvent.appointmentId,
    });

    return { success: true };
  }, { eventSource: 'COMPLETED_PROCESSOR' });

  await processRecord(event.Records);
};
