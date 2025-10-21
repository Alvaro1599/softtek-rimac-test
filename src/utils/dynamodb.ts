import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { AppointmentRecord } from '../types';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export const dynamoDb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.APPOINTMENTS_TABLE!;

export async function saveAppointment(appointment: AppointmentRecord): Promise<void> {
  await dynamoDb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: appointment,
    })
  );
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'pending' | 'completed'
): Promise<void> {
  await dynamoDb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { appointmentId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString(),
      },
    })
  );
}

export async function getAppointmentsByInsuredId(insuredId: string): Promise<AppointmentRecord[]> {
  const result = await dynamoDb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'InsuredIdIndex',
      KeyConditionExpression: 'insuredId = :insuredId',
      ExpressionAttributeValues: {
        ':insuredId': insuredId,
      },
    })
  );

  return (result.Items || []) as AppointmentRecord[];
}
