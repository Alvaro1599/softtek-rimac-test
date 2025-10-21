import { AppointmentProcessor } from '../../../services/AppointmentProcessor';
import { RDSRepository } from '../../../repositories/RDSRepository';
import { EventRepository } from '../../../repositories/EventRepository';
import { Logger } from '../../../utils/logger';
import { EventPayload } from '../../../events/types';

describe('AppointmentProcessor', () => {
  let processorPE: AppointmentProcessor;
  let processorCL: AppointmentProcessor;
  let mockRDSRepo: jest.Mocked<RDSRepository>;
  let mockEventRepo: jest.Mocked<EventRepository>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockRDSRepo = {
      saveAppointment: jest.fn(),
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

    processorPE = new AppointmentProcessor('PE', mockRDSRepo, mockEventRepo, mockLogger);
    processorCL = new AppointmentProcessor('CL', mockRDSRepo, mockEventRepo, mockLogger);
  });

  describe('processCreatedEvent', () => {
    it('should process Peru appointment event successfully', async () => {
      const event: EventPayload<'appointment.created'> = {
        appointmentId: 'test-uuid',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      await processorPE.processCreatedEvent(event);

      expect(mockRDSRepo.saveAppointment).toHaveBeenCalledWith(event);
      expect(mockEventRepo.publishCompleted).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentId: 'test-uuid',
          insuredId: '12345',
          scheduleId: 100,
          countryISO: 'PE',
        })
      );
    });

    it('should process Chile appointment event successfully', async () => {
      const event: EventPayload<'appointment.created'> = {
        appointmentId: 'test-uuid',
        insuredId: '67890',
        scheduleId: 200,
        countryISO: 'CL',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      await processorCL.processCreatedEvent(event);

      expect(mockRDSRepo.saveAppointment).toHaveBeenCalledWith(event);
      expect(mockEventRepo.publishCompleted).toHaveBeenCalledTimes(1);
    });

    it('should log processing start with country tag', async () => {
      const event: EventPayload<'appointment.created'> = {
        appointmentId: 'test-uuid',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      await processorPE.processCreatedEvent(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[PE] Processing appointment',
        expect.objectContaining({
          appointmentId: 'test-uuid',
          insuredId: '12345',
          countryISO: 'PE',
        })
      );
    });

    it('should log RDS save confirmation', async () => {
      const event: EventPayload<'appointment.created'> = {
        appointmentId: 'test-uuid',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      await processorPE.processCreatedEvent(event);

      expect(mockLogger.info).toHaveBeenCalledWith('[PE] Appointment saved to RDS', {
        appointmentId: 'test-uuid',
      });
    });

    it('should log completion event publication', async () => {
      const event: EventPayload<'appointment.created'> = {
        appointmentId: 'test-uuid',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      await processorPE.processCreatedEvent(event);

      expect(mockLogger.info).toHaveBeenCalledWith('[PE] Completion event published', {
        appointmentId: 'test-uuid',
      });
    });

    it('should skip processing when country mismatch - PE processor receives CL event', async () => {
      const event: EventPayload<'appointment.created'> = {
        appointmentId: 'test-uuid',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'CL',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      await processorPE.processCreatedEvent(event);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        '[PE] Event country mismatch',
        expect.objectContaining({
          expected: 'PE',
          received: 'CL',
          appointmentId: 'test-uuid',
        })
      );
      expect(mockRDSRepo.saveAppointment).not.toHaveBeenCalled();
      expect(mockEventRepo.publishCompleted).not.toHaveBeenCalled();
    });

    it('should skip processing when country mismatch - CL processor receives PE event', async () => {
      const event: EventPayload<'appointment.created'> = {
        appointmentId: 'test-uuid',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      await processorCL.processCreatedEvent(event);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        '[CL] Event country mismatch',
        expect.objectContaining({
          expected: 'CL',
          received: 'PE',
        })
      );
      expect(mockRDSRepo.saveAppointment).not.toHaveBeenCalled();
      expect(mockEventRepo.publishCompleted).not.toHaveBeenCalled();
    });

    it('should publish completed event with correct timestamp', async () => {
      const event: EventPayload<'appointment.created'> = {
        appointmentId: 'test-uuid',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      const beforeCall = new Date().toISOString();
      await processorPE.processCreatedEvent(event);
      const afterCall = new Date().toISOString();

      expect(mockEventRepo.publishCompleted).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
        })
      );

      const publishedEvent = mockEventRepo.publishCompleted.mock.calls[0][0];
      expect(publishedEvent.timestamp >= beforeCall).toBe(true);
      expect(publishedEvent.timestamp <= afterCall).toBe(true);
    });

    it('should throw error if RDS save fails', async () => {
      const event: EventPayload<'appointment.created'> = {
        appointmentId: 'test-uuid',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      mockRDSRepo.saveAppointment.mockRejectedValueOnce(new Error('RDS connection failed'));

      await expect(processorPE.processCreatedEvent(event)).rejects.toThrow(
        'RDS connection failed'
      );
    });

    it('should throw error if event publishing fails', async () => {
      const event: EventPayload<'appointment.created'> = {
        appointmentId: 'test-uuid',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      mockEventRepo.publishCompleted.mockRejectedValueOnce(new Error('Event bus error'));

      await expect(processorPE.processCreatedEvent(event)).rejects.toThrow('Event bus error');
    });

    it('should use Chile tag in logs for CL processor', async () => {
      const event: EventPayload<'appointment.created'> = {
        appointmentId: 'test-uuid',
        insuredId: '67890',
        scheduleId: 200,
        countryISO: 'CL',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      await processorCL.processCreatedEvent(event);

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[CL] Processing appointment',
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[CL] Appointment saved to RDS',
        expect.any(Object)
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[CL] Completion event published',
        expect.any(Object)
      );
    });

    it('should preserve all event fields in completed event', async () => {
      const event: EventPayload<'appointment.created'> = {
        appointmentId: 'test-uuid',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      await processorPE.processCreatedEvent(event);

      const completedEvent = mockEventRepo.publishCompleted.mock.calls[0][0];
      expect(completedEvent.appointmentId).toBe('test-uuid');
      expect(completedEvent.insuredId).toBe('12345');
      expect(completedEvent.scheduleId).toBe(100);
      expect(completedEvent.countryISO).toBe('PE');
    });
  });
});
