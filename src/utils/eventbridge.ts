import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { AppointmentCompletedEvent } from '../types';

const client = new EventBridgeClient({ region: process.env.AWS_REGION || 'us-east-1' });

export async function publishCompletedEvent(event: AppointmentCompletedEvent): Promise<void> {
  await client.send(
    new PutEventsCommand({
      Entries: [
        {
          Source: 'appointment.service',
          DetailType: 'appointment.completed',
          Detail: JSON.stringify(event),
          EventBusName: process.env.EVENT_BUS_NAME,
        },
      ],
    })
  );
}
