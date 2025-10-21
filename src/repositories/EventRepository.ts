import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { EventPayload } from '../events/types';

export class EventRepository {
  private readonly snsTopicArn: string;
  private readonly eventBusName: string;

  constructor(
    private readonly snsClient: SNSClient,
    private readonly eventBridgeClient: EventBridgeClient
  ) {
    this.snsTopicArn = process.env.SNS_TOPIC_ARN!;
    this.eventBusName = process.env.EVENT_BUS_NAME!;

    if (!this.snsTopicArn) {
      throw new Error('SNS_TOPIC_ARN environment variable is required');
    }

    if (!this.eventBusName) {
      throw new Error('EVENT_BUS_NAME environment variable is required');
    }
  }

  async publishCreated(event: EventPayload<'appointment.created'>): Promise<void> {
    await this.snsClient.send(
      new PublishCommand({
        TopicArn: this.snsTopicArn,
        Message: JSON.stringify(event),
        MessageAttributes: {
          countryISO: {
            DataType: 'String',
            StringValue: event.countryISO,
          },
        },
      })
    );
  }

  async publishCompleted(event: EventPayload<'appointment.completed'>): Promise<void> {
    await this.eventBridgeClient.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: 'appointment.service',
            DetailType: 'appointment.completed',
            Detail: JSON.stringify(event),
            EventBusName: this.eventBusName,
          },
        ],
      })
    );
  }
}
