import { DynamoDBDocumentClient, PutCommand, UpdateCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { Appointment } from '../domain/Appointment';
import { AppointmentNotFoundError } from '../errors';

export class AppointmentRepository {
  private readonly tableName: string;

  constructor(private readonly dynamoDb: DynamoDBDocumentClient) {
    this.tableName = process.env.APPOINTMENTS_TABLE!;

    if (!this.tableName) {
      throw new Error('APPOINTMENTS_TABLE environment variable is required');
    }
  }

  async save(appointment: Appointment): Promise<void> {
    await this.dynamoDb.send(
      new PutCommand({
        TableName: this.tableName,
        Item: appointment.toRecord(),
      })
    );
  }

  async findById(appointmentId: string): Promise<Appointment | null> {
    const result = await this.dynamoDb.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { appointmentId },
      })
    );

    if (!result.Item) {
      return null;
    }

    return Appointment.fromRecord(result.Item as any);
  }

  async findByIdOrFail(appointmentId: string): Promise<Appointment> {
    const appointment = await this.findById(appointmentId);

    if (!appointment) {
      throw new AppointmentNotFoundError(appointmentId);
    }

    return appointment;
  }

  async findByInsuredId(insuredId: string): Promise<Appointment[]> {
    const result = await this.dynamoDb.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'InsuredIdIndex',
        KeyConditionExpression: 'insuredId = :insuredId',
        ExpressionAttributeValues: {
          ':insuredId': insuredId,
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    return result.Items.map((item) => Appointment.fromRecord(item as any));
  }

  async updateStatus(
    appointmentId: string,
    status: 'pending' | 'completed'
  ): Promise<void> {
    await this.dynamoDb.send(
      new UpdateCommand({
        TableName: this.tableName,
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

  async exists(appointmentId: string): Promise<boolean> {
    const appointment = await this.findById(appointmentId);
    return appointment !== null;
  }
}
