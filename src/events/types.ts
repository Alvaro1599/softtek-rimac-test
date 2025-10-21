/**
 * Centralización de tipos de eventos del sistema
 * Todos los eventos deben estar registrados aquí para garantizar type-safety
 */

/**
 * Registry de eventos del dominio de appointments
 */
export type AppointmentEvents = {
  /**
   * Evento publicado cuando se crea una nueva cita
   * Se publica a SNS para enrutamiento por país (PE/CL)
   */
  'appointment.created': {
    appointmentId: string;
    insuredId: string;
    scheduleId: number;
    countryISO: 'PE' | 'CL';
    timestamp: string;
  };

  /**
   * Evento publicado cuando una cita se completa y se guarda en RDS
   * Se publica a EventBridge para procesamiento posterior
   */
  'appointment.completed': {
    appointmentId: string;
    insuredId: string;
    scheduleId: number;
    countryISO: 'PE' | 'CL';
    timestamp: string;
  };
};

/**
 * Tipos de eventos disponibles en el sistema
 */
export type EventType = keyof AppointmentEvents;

/**
 * Obtiene el payload tipado de un evento específico
 * @example
 * type CreatedPayload = EventPayload<'appointment.created'>
 */
export type EventPayload<T extends EventType> = AppointmentEvents[T];

/**
 * Estructura de un mensaje SNS wrapeado en SQS
 * Usado por los consumidores de SQS (lambdas PE/CL)
 */
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

/**
 * Helper para parsear mensajes SNS desde SQS Records
 */
export function parseSNSMessage<T extends EventType>(
  sqsRecordBody: string
): EventPayload<T> {
  const snsMessage: SNSMessageWrapper<T> = JSON.parse(sqsRecordBody);
  return JSON.parse(snsMessage.Message) as EventPayload<T>;
}

/**
 * Type guard para validar tipo de evento
 */
export function isEventType(value: string): value is EventType {
  return ['appointment.created', 'appointment.completed'].includes(value);
}

/**
 * Tipos de input para APIs
 * Representa los datos que llegan desde el cliente
 */
export type CreateAppointmentInput = Omit<EventPayload<'appointment.created'>, 'appointmentId' | 'timestamp'>;
