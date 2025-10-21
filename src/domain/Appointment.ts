import { randomUUID } from 'crypto';
import { AppointmentRecord } from '../types';
import { EventPayload, CreateAppointmentInput } from '../events/types';
import { validateInsuredId, validateCountryISO, validateRequired } from '../utils/validators';

export class Appointment {
  private constructor(
    public readonly id: string,
    public readonly insuredId: string,
    public readonly scheduleId: number,
    public readonly countryISO: 'PE' | 'CL',
    public readonly status: 'pending' | 'completed',
    public readonly createdAt: string,
    public readonly updatedAt?: string
  ) {}

  static create(input: CreateAppointmentInput): Appointment {
    validateRequired(input, ['insuredId', 'scheduleId', 'countryISO']);

    validateInsuredId(input.insuredId);
    validateCountryISO(input.countryISO);

    return new Appointment(
      randomUUID(),
      input.insuredId,
      input.scheduleId,
      input.countryISO,
      'pending',
      new Date().toISOString()
    );
  }

  static fromRecord(record: AppointmentRecord): Appointment {
    return new Appointment(
      record.appointmentId,
      record.insuredId,
      record.scheduleId,
      record.countryISO,
      record.status,
      record.createdAt,
      record.updatedAt
    );
  }

  toRecord(): AppointmentRecord {
    return {
      appointmentId: this.id,
      insuredId: this.insuredId,
      scheduleId: this.scheduleId,
      countryISO: this.countryISO,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toCreatedEvent(): EventPayload<'appointment.created'> {
    return {
      appointmentId: this.id,
      insuredId: this.insuredId,
      scheduleId: this.scheduleId,
      countryISO: this.countryISO,
      timestamp: this.createdAt,
    };
  }

  toCompletedEvent(): EventPayload<'appointment.completed'> {
    return {
      appointmentId: this.id,
      insuredId: this.insuredId,
      scheduleId: this.scheduleId,
      countryISO: this.countryISO,
      timestamp: new Date().toISOString(),
    };
  }

  toDTO() {
    return {
      appointmentId: this.id,
      insuredId: this.insuredId,
      scheduleId: this.scheduleId,
      countryISO: this.countryISO,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
