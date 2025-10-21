import { Appointment } from '../../../domain/Appointment';
import { CreateAppointmentInput } from '../../../events/types';
import {
  MissingRequiredFieldError,
  InvalidCountryCodeError,
  InvalidInsuredIdError,
} from '../../../errors';

describe('Appointment Domain', () => {
  describe('create', () => {
    it('should create a valid appointment with all required fields', () => {
      const input: CreateAppointmentInput = {
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
      };

      const appointment = Appointment.create(input);

      expect(appointment.id).toBeDefined();
      expect(appointment.insuredId).toBe('12345');
      expect(appointment.scheduleId).toBe(100);
      expect(appointment.countryISO).toBe('PE');
      expect(appointment.status).toBe('pending');
      expect(appointment.createdAt).toBeDefined();
      expect(appointment.updatedAt).toBeUndefined();
    });

    it('should create appointment for Chile', () => {
      const input: CreateAppointmentInput = {
        insuredId: '67890',
        scheduleId: 200,
        countryISO: 'CL',
      };

      const appointment = Appointment.create(input);

      expect(appointment.countryISO).toBe('CL');
    });

    it('should throw MissingRequiredFieldError when insuredId is missing', () => {
      const input = {
        scheduleId: 100,
        countryISO: 'PE',
      } as CreateAppointmentInput;

      expect(() => Appointment.create(input)).toThrow(MissingRequiredFieldError);
    });

    it('should throw MissingRequiredFieldError when scheduleId is missing', () => {
      const input = {
        insuredId: '12345',
        countryISO: 'PE',
      } as CreateAppointmentInput;

      expect(() => Appointment.create(input)).toThrow(MissingRequiredFieldError);
    });

    it('should throw MissingRequiredFieldError when countryISO is missing', () => {
      const input = {
        insuredId: '12345',
        scheduleId: 100,
      } as CreateAppointmentInput;

      expect(() => Appointment.create(input)).toThrow(MissingRequiredFieldError);
    });

    it('should throw InvalidInsuredIdError for invalid insuredId format', () => {
      const input: CreateAppointmentInput = {
        insuredId: '123',
        scheduleId: 100,
        countryISO: 'PE',
      };

      expect(() => Appointment.create(input)).toThrow(InvalidInsuredIdError);
    });

    it('should throw InvalidInsuredIdError for non-numeric insuredId', () => {
      const input: CreateAppointmentInput = {
        insuredId: 'abcde',
        scheduleId: 100,
        countryISO: 'PE',
      };

      expect(() => Appointment.create(input)).toThrow(InvalidInsuredIdError);
    });

    it('should throw InvalidCountryCodeError for invalid country', () => {
      const input: CreateAppointmentInput = {
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'US' as any,
      };

      expect(() => Appointment.create(input)).toThrow(InvalidCountryCodeError);
    });
  });

  describe('fromRecord', () => {
    it('should create appointment from database record', () => {
      const record = {
        appointmentId: 'test-uuid',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE' as const,
        status: 'pending' as const,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      const appointment = Appointment.fromRecord(record);

      expect(appointment.id).toBe('test-uuid');
      expect(appointment.insuredId).toBe('12345');
      expect(appointment.scheduleId).toBe(100);
      expect(appointment.countryISO).toBe('PE');
      expect(appointment.status).toBe('pending');
      expect(appointment.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(appointment.updatedAt).toBe('2024-01-02T00:00:00.000Z');
    });

    it('should create appointment without updatedAt', () => {
      const record = {
        appointmentId: 'test-uuid',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'CL' as const,
        status: 'completed' as const,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      const appointment = Appointment.fromRecord(record);

      expect(appointment.updatedAt).toBeUndefined();
    });
  });

  describe('toRecord', () => {
    it('should convert appointment to database record', () => {
      const input: CreateAppointmentInput = {
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
      };

      const appointment = Appointment.create(input);
      const record = appointment.toRecord();

      expect(record.appointmentId).toBe(appointment.id);
      expect(record.insuredId).toBe('12345');
      expect(record.scheduleId).toBe(100);
      expect(record.countryISO).toBe('PE');
      expect(record.status).toBe('pending');
      expect(record.createdAt).toBeDefined();
      expect(record.updatedAt).toBeUndefined();
    });
  });

  describe('toCreatedEvent', () => {
    it('should convert appointment to created event', () => {
      const input: CreateAppointmentInput = {
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
      };

      const appointment = Appointment.create(input);
      const event = appointment.toCreatedEvent();

      expect(event.appointmentId).toBe(appointment.id);
      expect(event.insuredId).toBe('12345');
      expect(event.scheduleId).toBe(100);
      expect(event.countryISO).toBe('PE');
      expect(event.timestamp).toBe(appointment.createdAt);
    });
  });

  describe('toCompletedEvent', () => {
    it('should convert appointment to completed event', () => {
      const input: CreateAppointmentInput = {
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'CL',
      };

      const appointment = Appointment.create(input);
      const event = appointment.toCompletedEvent();

      expect(event.appointmentId).toBe(appointment.id);
      expect(event.insuredId).toBe('12345');
      expect(event.scheduleId).toBe(100);
      expect(event.countryISO).toBe('CL');
      expect(event.timestamp).toBeDefined();
    });
  });

  describe('toDTO', () => {
    it('should convert appointment to DTO format', () => {
      const input: CreateAppointmentInput = {
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
      };

      const appointment = Appointment.create(input);
      const dto = appointment.toDTO();

      expect(dto.appointmentId).toBe(appointment.id);
      expect(dto.insuredId).toBe('12345');
      expect(dto.scheduleId).toBe(100);
      expect(dto.countryISO).toBe('PE');
      expect(dto.status).toBe('pending');
      expect(dto.createdAt).toBeDefined();
      expect(dto.updatedAt).toBeUndefined();
    });

    it('should include updatedAt in DTO when present', () => {
      const record = {
        appointmentId: 'test-uuid',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE' as const,
        status: 'completed' as const,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      const appointment = Appointment.fromRecord(record);
      const dto = appointment.toDTO();

      expect(dto.updatedAt).toBe('2024-01-02T00:00:00.000Z');
    });
  });
});
