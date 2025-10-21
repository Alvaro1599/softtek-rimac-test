
export type AppointmentEvents = {

  'appointment.created': {
    appointmentId: string;
    insuredId: string;
    scheduleId: number;
    countryISO: 'PE' | 'CL';
    timestamp: string;
  };

  'appointment.completed': {
    appointmentId: string;
    insuredId: string;
    scheduleId: number;
    countryISO: 'PE' | 'CL';
    timestamp: string;
  };
};

export type EventType = keyof AppointmentEvents;

export type EventPayload<T extends EventType> = AppointmentEvents[T];

export interface SNSMessageWrapper<T extends EventType> {
  Message: string; // JSON string del EventPayload<T>
  MessageId: string;
  Signature: string;
  SignatureVersion: string;
  SigningCertURL: string;
  Timestamp: string;
  TopicArn: string;
  Type: 'Notification';
  UnsubscribeURL: string;
  MessageAttributes?: {
    countryISO?: {
      Type: 'String';
      Value: 'PE' | 'CL';
    };
  };
}

export function parseSNSMessage<T extends EventType>(
  sqsRecordBody: string
): EventPayload<T> {
  const snsMessage: SNSMessageWrapper<T> = JSON.parse(sqsRecordBody);
  return JSON.parse(snsMessage.Message) as EventPayload<T>;
}

export function isEventType(value: string): value is EventType {
  return ['appointment.created', 'appointment.completed'].includes(value);
}

export type CreateAppointmentInput = Omit<EventPayload<'appointment.created'>, 'appointmentId' | 'timestamp'>;
