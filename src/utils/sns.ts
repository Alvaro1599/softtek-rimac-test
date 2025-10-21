import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { EventPayload } from '../events/types';

const client = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });

export async function publishToSNS(
  payload: EventPayload<'appointment.created'>
): Promise<void> {
  await client.send(
    new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Message: JSON.stringify(payload),
      MessageAttributes: {
        countryISO: {
          DataType: 'String',
          StringValue: payload.countryISO,
        },
      },
    })
  );
}
