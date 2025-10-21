import { SQSEvent, SQSRecord } from 'aws-lambda';
import { saveToRDS } from '../utils/rds';
import { publishCompletedEvent } from '../utils/eventbridge';
import { parseSNSMessage, EventPayload } from '../events/types';

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('[PE] Processing SQS messages:', event.Records.length);

  for (const record of event.Records) {
    await processRecord(record);
  }
};

async function processRecord(record: SQSRecord): Promise<void> {
  try {
    const appointment: EventPayload<'appointment.created'> = parseSNSMessage(record.body);

    console.log('[PE] Processing appointment:', appointment);

    await saveToRDS(appointment, 'PE');

    console.log('[PE] Appointment saved to RDS:', appointment.appointmentId);

    await publishCompletedEvent({
      appointmentId: appointment.appointmentId,
      insuredId: appointment.insuredId,
      scheduleId: appointment.scheduleId,
      countryISO: appointment.countryISO,
      timestamp: new Date().toISOString(),
    });

    console.log('[PE] Completion event published:', appointment.appointmentId);
  } catch (error) {
    console.error('[PE] Error processing record:', error);
    throw error;
  }
}
