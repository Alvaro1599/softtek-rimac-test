import { SQSEvent, SQSRecord } from 'aws-lambda';
import { AppointmentRequest } from '../types';
import { saveToRDS } from '../utils/rds';
import { publishCompletedEvent } from '../utils/eventbridge';

export const handler = async (event: SQSEvent): Promise<void> => {
  console.log('[CL] Processing SQS messages:', event.Records.length);

  for (const record of event.Records) {
    await processRecord(record);
  }
};

async function processRecord(record: SQSRecord): Promise<void> {
  try {
    const snsMessage = JSON.parse(record.body);
    const appointment: AppointmentRequest & { appointmentId: string } = JSON.parse(snsMessage.Message);

    console.log('[CL] Processing appointment:', appointment);

    await saveToRDS(appointment, 'CL');

    console.log('[CL] Appointment saved to RDS:', appointment.appointmentId);

    await publishCompletedEvent({
      appointmentId: appointment.appointmentId,
      insuredId: appointment.insuredId,
      scheduleId: appointment.scheduleId,
      countryISO: appointment.countryISO,
      timestamp: new Date().toISOString(),
    });

    console.log('[CL] Completion event published:', appointment.appointmentId);
  } catch (error) {
    console.error('[CL] Error processing record:', error);
    throw error;
  }
}
