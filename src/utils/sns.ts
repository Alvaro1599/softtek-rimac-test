import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { AppointmentRequest } from '../types';

const client = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });

export async function publishToSNS(appointment: AppointmentRequest & { appointmentId: string }): Promise<void> {
  await client.send(
    new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Message: JSON.stringify(appointment),
      MessageAttributes: {
        countryISO: {
          DataType: 'String',
          StringValue: appointment.countryISO,
        },
      },
    })
  );
}
