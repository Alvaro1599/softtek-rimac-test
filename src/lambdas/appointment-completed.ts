import { SQSEvent, SQSRecord } from 'aws-lambda';
import { updateAppointmentStatus } from '../utils/dynamodb';
import { EventPayload } from '../events/types';

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('[COMPLETED] Processing SQS messages:', event.Records.length);

  for (const record of event.Records) {
    await processRecord(record);
  }
};

async function processRecord(record: SQSRecord): Promise<void> {
  try {
    const eventBridgeMessage = JSON.parse(record.body);
    const completedEvent: EventPayload<'appointment.completed'> = eventBridgeMessage.detail;

    console.log('[COMPLETED] Processing completed event:', completedEvent);

    await updateAppointmentStatus(completedEvent.appointmentId, 'completed');

    console.log('[COMPLETED] Appointment status updated to completed:', completedEvent.appointmentId);
  } catch (error) {
    console.error('[COMPLETED] Error processing record:', error);
    throw error;
  }
}
