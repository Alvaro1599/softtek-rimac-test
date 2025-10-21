import { SQSEvent } from 'aws-lambda';
import { withBatchEventHandler } from '../utils/lambda-wrapper';
import { getDynamoDBClient } from '../repositories/connections';
import { AppointmentRepository } from '../repositories/AppointmentRepository';
import { EventPayload } from '../events/types';

export const handler = async (event: SQSEvent): Promise<void> => {
  const processRecord = withBatchEventHandler(
    async (record, logger) => {

      const eventBridgeMessage = JSON.parse(record.body);
      const completedEvent: EventPayload<'appointment.completed'> = eventBridgeMessage.detail;

      logger.info('[COMPLETED] Processing completed event', {
        appointmentId: completedEvent.appointmentId,
        insuredId: completedEvent.insuredId,
        countryISO: completedEvent.countryISO,
      });

      const dynamoDb = getDynamoDBClient();
      const appointmentRepo = new AppointmentRepository(dynamoDb);

      await appointmentRepo.updateStatus(completedEvent.appointmentId, 'completed');

      logger.info('[COMPLETED] Appointment status updated to completed', {
        appointmentId: completedEvent.appointmentId,
      });

      return { success: true };
    },
    { eventSource: 'COMPLETED_PROCESSOR' }
  );

  await processRecord(event.Records);
};
