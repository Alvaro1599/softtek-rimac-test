import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SNSClient } from '@aws-sdk/client-sns';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';

let dynamoDbClient: DynamoDBDocumentClient | null = null;
let snsClient: SNSClient | null = null;
let eventBridgeClient: EventBridgeClient | null = null;

export function getDynamoDBClient(): DynamoDBDocumentClient {
  if (!dynamoDbClient) {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    dynamoDbClient = DynamoDBDocumentClient.from(client);
  }
  return dynamoDbClient;
}

export function getSNSClient(): SNSClient {
  if (!snsClient) {
    snsClient = new SNSClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }
  return snsClient;
}

export function getEventBridgeClient(): EventBridgeClient {
  if (!eventBridgeClient) {
    eventBridgeClient = new EventBridgeClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }
  return eventBridgeClient;
}

export function resetConnections(): void {
  dynamoDbClient = null;
  snsClient = null;
  eventBridgeClient = null;
}
