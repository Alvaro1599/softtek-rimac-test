import { AppointmentService } from '../../../services/AppointmentService';
import { Appointment } from '../../../domain/Appointment';
import { AppointmentRepository } from '../../../repositories/AppointmentRepository';
import { EventRepository } from '../../../repositories/EventRepository';
import { Logger } from '../../../utils/logger';
import { CreateAppointmentInput } from '../../../events/types';
import { MissingRequiredFieldError } from '../../../errors';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let mockAppointmentRepo: jest.Mocked<AppointmentRepository>;
  let mockEventRepo: jest.Mocked<EventRepository>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockAppointmentRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIdOrFail: jest.fn(),
      findByInsuredId: jest.fn(),
      updateStatus: jest.fn(),
      exists: jest.fn(),
    } as any;

    mockEventRepo = {
      publishCreated: jest.fn(),
      publishCompleted: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    service = new AppointmentService(mockAppointmentRepo, mockEventRepo, mockLogger);
  });

  describe('createAppointment', () => {
    it('should create appointment successfully for Peru', async () => {
      const input: CreateAppointmentInput = {
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
      };

      const result = await service.createAppointment(input);

      expect(result).toHaveProperty('message', 'Appointment request is being processed');
      expect(result).toHaveProperty('appointmentId');
      expect(result).toHaveProperty('status', 'pending');
      expect(mockAppointmentRepo.save).toHaveBeenCalledTimes(1);
      expect(mockEventRepo.publishCreated).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating new appointment',
        expect.objectContaining({
          insuredId: '12345',
          countryISO: 'PE',
        })
      );
    });

    it('should create appointment successfully for Chile', async () => {
      const input: CreateAppointmentInput = {
        insuredId: '67890',
        scheduleId: 200,
        countryISO: 'CL',
      };

      const result = await service.createAppointment(input);

      expect(result.status).toBe('pending');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating new appointment',
        expect.objectContaining({
          insuredId: '67890',
          countryISO: 'CL',
        })
      );
    });

    it('should save appointment to repository', async () => {
      const input: CreateAppointmentInput = {
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
      };

      await service.createAppointment(input);

      expect(mockAppointmentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          insuredId: '12345',
          scheduleId: 100,
          countryISO: 'PE',
          status: 'pending',
        })
      );
    });

    it('should publish created event with correct payload', async () => {
      const input: CreateAppointmentInput = {
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
      };

      await service.createAppointment(input);

      expect(mockEventRepo.publishCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          insuredId: '12345',
          scheduleId: 100,
          countryISO: 'PE',
          appointmentId: expect.any(String),
          timestamp: expect.any(String),
        })
      );
    });

    it('should log all steps of appointment creation', async () => {
      const input: CreateAppointmentInput = {
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
      };

      await service.createAppointment(input);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating new appointment',
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Appointment entity created',
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Appointment saved to database',
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Appointment created event published',
        expect.any(Object)
      );
    });

    it('should throw error if repository save fails', async () => {
      const input: CreateAppointmentInput = {
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
      };

      mockAppointmentRepo.save.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.createAppointment(input)).rejects.toThrow('Database error');
    });

    it('should throw error if event publishing fails', async () => {
      const input: CreateAppointmentInput = {
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
      };

      mockEventRepo.publishCreated.mockRejectedValueOnce(new Error('Event bus error'));

      await expect(service.createAppointment(input)).rejects.toThrow('Event bus error');
    });
  });

  describe('getAppointmentsByInsuredId', () => {
    it('should retrieve appointments for valid insuredId', async () => {
      const appointments = [
        Appointment.create({
          insuredId: '12345',
          scheduleId: 100,
          countryISO: 'PE',
        }),
        Appointment.create({
          insuredId: '12345',
          scheduleId: 200,
          countryISO: 'CL',
        }),
      ];

      mockAppointmentRepo.findByInsuredId.mockResolvedValueOnce(appointments);

      const result = await service.getAppointmentsByInsuredId('12345');

      expect(result.insuredId).toBe('12345');
      expect(result.count).toBe(2);
      expect(result.appointments).toHaveLength(2);
      expect(result.appointments[0]).toHaveProperty('appointmentId');
      expect(result.appointments[0]).toHaveProperty('status');
    });

    it('should return empty array when no appointments found', async () => {
      mockAppointmentRepo.findByInsuredId.mockResolvedValueOnce([]);

      const result = await service.getAppointmentsByInsuredId('99999');

      expect(result.count).toBe(0);
      expect(result.appointments).toEqual([]);
    });

    it('should throw MissingRequiredFieldError when insuredId is undefined', async () => {
      await expect(service.getAppointmentsByInsuredId(undefined)).rejects.toThrow(
        MissingRequiredFieldError
      );
    });

    it('should throw MissingRequiredFieldError when insuredId is empty string', async () => {
      await expect(service.getAppointmentsByInsuredId('')).rejects.toThrow(
        MissingRequiredFieldError
      );
    });

    it('should log fetch operation', async () => {
      mockAppointmentRepo.findByInsuredId.mockResolvedValueOnce([]);

      await service.getAppointmentsByInsuredId('12345');

      expect(mockLogger.info).toHaveBeenCalledWith('Fetching appointments', {
        insuredId: '12345',
      });
    });

    it('should log retrieved appointments count', async () => {
      const appointments = [
        Appointment.create({
          insuredId: '12345',
          scheduleId: 100,
          countryISO: 'PE',
        }),
      ];

      mockAppointmentRepo.findByInsuredId.mockResolvedValueOnce(appointments);

      await service.getAppointmentsByInsuredId('12345');

      expect(mockLogger.info).toHaveBeenCalledWith('Appointments retrieved', {
        insuredId: '12345',
        count: 1,
      });
    });

    it('should call repository with correct insuredId', async () => {
      mockAppointmentRepo.findByInsuredId.mockResolvedValueOnce([]);

      await service.getAppointmentsByInsuredId('54321');

      expect(mockAppointmentRepo.findByInsuredId).toHaveBeenCalledWith('54321');
    });

    it('should return appointments as DTOs', async () => {
      const appointment = Appointment.create({
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
      });

      mockAppointmentRepo.findByInsuredId.mockResolvedValueOnce([appointment]);

      const result = await service.getAppointmentsByInsuredId('12345');

      expect(result.appointments[0]).toEqual(appointment.toDTO());
    });
  });

  describe('getAppointmentById', () => {
    it('should retrieve appointment by id', async () => {
      const appointment = Appointment.create({
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
      });

      mockAppointmentRepo.findByIdOrFail.mockResolvedValueOnce(appointment);

      const result = await service.getAppointmentById(appointment.id);

      expect(result).toHaveProperty('appointmentId', appointment.id);
      expect(result).toHaveProperty('insuredId', '12345');
      expect(result).toHaveProperty('scheduleId', 100);
      expect(result).toHaveProperty('countryISO', 'PE');
      expect(result).toHaveProperty('status', 'pending');
    });

    it('should throw MissingRequiredFieldError when appointmentId is undefined', async () => {
      await expect(service.getAppointmentById(undefined)).rejects.toThrow(
        MissingRequiredFieldError
      );
    });

    it('should throw MissingRequiredFieldError when appointmentId is empty string', async () => {
      await expect(service.getAppointmentById('')).rejects.toThrow(
        MissingRequiredFieldError
      );
    });

    it('should log fetch operation', async () => {
      const appointment = Appointment.create({
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
      });

      mockAppointmentRepo.findByIdOrFail.mockResolvedValueOnce(appointment);

      await service.getAppointmentById('test-id');

      expect(mockLogger.info).toHaveBeenCalledWith('Fetching appointment by id', {
        appointmentId: 'test-id',
      });
    });

    it('should log retrieved appointment', async () => {
      const appointment = Appointment.create({
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
      });

      mockAppointmentRepo.findByIdOrFail.mockResolvedValueOnce(appointment);

      await service.getAppointmentById(appointment.id);

      expect(mockLogger.info).toHaveBeenCalledWith('Appointment retrieved', {
        appointmentId: appointment.id,
      });
    });

    it('should call repository with correct appointmentId', async () => {
      const appointment = Appointment.create({
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
      });

      mockAppointmentRepo.findByIdOrFail.mockResolvedValueOnce(appointment);

      await service.getAppointmentById('test-appointment-id');

      expect(mockAppointmentRepo.findByIdOrFail).toHaveBeenCalledWith('test-appointment-id');
    });

    it('should return appointment as DTO', async () => {
      const appointment = Appointment.create({
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
      });

      mockAppointmentRepo.findByIdOrFail.mockResolvedValueOnce(appointment);

      const result = await service.getAppointmentById(appointment.id);

      expect(result).toEqual(appointment.toDTO());
    });
  });
});
