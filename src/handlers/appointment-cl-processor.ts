import { SQSEvent } from 'aws-lambda';
import { withBatchEventHandler } from '../utils/lambda-wrapper';
import { createCLAppointmentProcessor } from '../services/factories';
import { parseSNSMessage, EventPayload } from '../events/types';

export const handler = async (event: SQSEvent): Promise<void> => {
  const processRecord = withBatchEventHandler(
    async (record, logger) => {
      const appointment: EventPayload<'appointment.created'> = parseSNSMessage(record.body);

      const processor = createCLAppointmentProcessor(logger);

      await processor.processCreatedEvent(appointment);

      return { success: true };
    },
    { eventSource: 'CL_PROCESSOR' }
  );

  await processRecord(event.Records);
};
