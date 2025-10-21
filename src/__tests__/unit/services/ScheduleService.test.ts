import { ScheduleService } from '../../../services/ScheduleService';
import { Logger } from '../../../utils/logger';
import { MissingRequiredFieldError } from '../../../errors';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    service = new ScheduleService(mockLogger);
  });

  describe('getAvailableSchedules', () => {
    it('should return available schedules for Peru', async () => {
      const result = await service.getAvailableSchedules('PE');

      expect(result).toHaveProperty('count');
      expect(result).toHaveProperty('schedules');
      expect(result.count).toBeGreaterThan(0);
      expect(result.schedules.length).toBe(result.count);
      expect(result.schedules[0]).toHaveProperty('scheduleId');
      expect(result.schedules[0]).toHaveProperty('countryISO', 'PE');
      expect(result.schedules[0]).toHaveProperty('available', true);
    });

    it('should return available schedules for Chile', async () => {
      const result = await service.getAvailableSchedules('CL');

      expect(result).toHaveProperty('count');
      expect(result.schedules[0]).toHaveProperty('countryISO', 'CL');
      expect(result.count).toBeGreaterThan(0);
    });

    it('should filter schedules by specialty', async () => {
      const result = await service.getAvailableSchedules('PE', undefined, '1');

      expect(result.count).toBeGreaterThan(0);
      result.schedules.forEach((schedule) => {
        expect(schedule.specialtyId).toBe(1);
      });
    });

    it('should filter schedules by date', async () => {
      const targetDate = '2025-10-25';
      const result = await service.getAvailableSchedules('PE', targetDate);

      expect(result.count).toBeGreaterThan(0);
      result.schedules.forEach((schedule) => {
        expect(schedule.date).toBe(targetDate);
      });
    });

    it('should throw error when countryISO is missing', async () => {
      await expect(service.getAvailableSchedules(undefined)).rejects.toThrow(
        MissingRequiredFieldError
      );
    });

    it('should throw error when countryISO is invalid', async () => {
      await expect(service.getAvailableSchedules('US')).rejects.toThrow(
        'Invalid countryISO. Must be PE or CL'
      );
    });

    it('should log fetching and retrieval', async () => {
      await service.getAvailableSchedules('PE', '2025-10-25', '2');

      expect(mockLogger.info).toHaveBeenCalledWith('Fetching available schedules', {
        countryISO: 'PE',
        date: '2025-10-25',
        specialtyId: '2',
      });

      expect(mockLogger.info).toHaveBeenCalledWith('Schedules retrieved', {
        count: expect.any(Number),
      });
    });

    it('should return schedules with all required fields', async () => {
      const result = await service.getAvailableSchedules('PE');

      expect(result.schedules[0]).toHaveProperty('scheduleId');
      expect(result.schedules[0]).toHaveProperty('date');
      expect(result.schedules[0]).toHaveProperty('time');
      expect(result.schedules[0]).toHaveProperty('specialtyId');
      expect(result.schedules[0]).toHaveProperty('specialtyName');
      expect(result.schedules[0]).toHaveProperty('doctorName');
      expect(result.schedules[0]).toHaveProperty('medicalCenter');
      expect(result.schedules[0]).toHaveProperty('countryISO');
      expect(result.schedules[0]).toHaveProperty('available');
    });
  });
});
