import { SQSEvent } from 'aws-lambda';
import { withBatchEventHandler } from '../utils/lambda-wrapper';
import { createPEAppointmentProcessor } from '../services/factories';
import { parseSNSMessage, EventPayload } from '../events/types';

export const handler = async (event: SQSEvent): Promise<void> => {
  const processRecord = withBatchEventHandler(
    async (record, logger) => {

      const appointment: EventPayload<'appointment.created'> = parseSNSMessage(record.body);

      const processor = createPEAppointmentProcessor(logger);

      await processor.processCreatedEvent(appointment);

      return { success: true };
    },
    { eventSource: 'PE_PROCESSOR' }
  );

  await processRecord(event.Records);
};
