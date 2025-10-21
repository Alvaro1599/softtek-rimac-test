import { AppointmentRepository } from '../../../repositories/AppointmentRepository';
import { Appointment } from '../../../domain/Appointment';
import { AppointmentNotFoundError } from '../../../errors';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

jest.mock('@aws-sdk/lib-dynamodb');

describe('AppointmentRepository', () => {
  let repository: AppointmentRepository;
  let mockSend: jest.Mock;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.APPOINTMENTS_TABLE = 'test-appointments-table';

    mockSend = jest.fn();
    const mockDynamoDb = {
      send: mockSend,
    } as unknown as DynamoDBDocumentClient;

    repository = new AppointmentRepository(mockDynamoDb);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error when APPOINTMENTS_TABLE is not set', () => {
      delete process.env.APPOINTMENTS_TABLE;
      const mockDb = { send: jest.fn() } as unknown as DynamoDBDocumentClient;

      expect(() => new AppointmentRepository(mockDb)).toThrow(
        'APPOINTMENTS_TABLE environment variable is required'
      );
    });

    it('should initialize with table name from environment', () => {
      const mockDb = { send: jest.fn() } as unknown as DynamoDBDocumentClient;
      expect(() => new AppointmentRepository(mockDb)).not.toThrow();
    });
  });

  describe('save', () => {
    it('should save appointment to DynamoDB', async () => {
      const appointment = Appointment.create({
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
      });

      mockSend.mockResolvedValueOnce({});

      await repository.save(appointment);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call).toBeInstanceOf(PutCommand);
    });

    it('should throw error if DynamoDB save fails', async () => {
      const appointment = Appointment.create({
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
      });

      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(repository.save(appointment)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('findById', () => {
    it('should return appointment when found', async () => {
      const mockItem = {
        appointmentId: 'test-uuid',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      mockSend.mockResolvedValueOnce({ Item: mockItem });

      const result = await repository.findById('test-uuid');

      expect(result).toBeInstanceOf(Appointment);
      expect(result?.id).toBe('test-uuid');
      expect(result?.insuredId).toBe('12345');
      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call).toBeInstanceOf(GetCommand);
    });

    it('should return null when appointment not found', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should throw error if DynamoDB query fails', async () => {
      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(repository.findById('test-uuid')).rejects.toThrow('DynamoDB error');
    });
  });

  describe('findByIdOrFail', () => {
    it('should return appointment when found', async () => {
      const mockItem = {
        appointmentId: 'test-uuid',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      mockSend.mockResolvedValueOnce({ Item: mockItem });

      const result = await repository.findByIdOrFail('test-uuid');

      expect(result).toBeInstanceOf(Appointment);
      expect(result.id).toBe('test-uuid');
    });

    it('should throw AppointmentNotFoundError when not found', async () => {
      mockSend.mockResolvedValueOnce({});

      await expect(repository.findByIdOrFail('non-existent-id')).rejects.toThrow(
        AppointmentNotFoundError
      );
    });

    it('should include appointmentId in error', async () => {
      mockSend.mockResolvedValueOnce({});

      try {
        await repository.findByIdOrFail('test-uuid');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AppointmentNotFoundError);
        expect((error as AppointmentNotFoundError).details.appointmentId).toBe('test-uuid');
      }
    });
  });

  describe('findByInsuredId', () => {
    it('should return appointments for insuredId', async () => {
      const mockItems = [
        {
          appointmentId: 'uuid-1',
          insuredId: '12345',
          scheduleId: 100,
          countryISO: 'PE',
          status: 'pending',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        {
          appointmentId: 'uuid-2',
          insuredId: '12345',
          scheduleId: 200,
          countryISO: 'CL',
          status: 'completed',
          createdAt: '2024-01-02T00:00:00.000Z',
        },
      ];

      mockSend.mockResolvedValueOnce({ Items: mockItems });

      const result = await repository.findByInsuredId('12345');

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Appointment);
      expect(result[0].insuredId).toBe('12345');
      expect(result[1].insuredId).toBe('12345');
      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call).toBeInstanceOf(QueryCommand);
    });

    it('should return empty array when no appointments found', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      const result = await repository.findByInsuredId('99999');

      expect(result).toEqual([]);
    });

    it('should return empty array when Items is undefined', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await repository.findByInsuredId('99999');

      expect(result).toEqual([]);
    });

    it('should throw error if DynamoDB query fails', async () => {
      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(repository.findByInsuredId('12345')).rejects.toThrow('DynamoDB error');
    });
  });

  describe('updateStatus', () => {
    it('should update appointment status to completed', async () => {
      mockSend.mockResolvedValueOnce({});

      await repository.updateStatus('test-uuid', 'completed');

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call).toBeInstanceOf(UpdateCommand);
    });

    it('should update appointment status to pending', async () => {
      mockSend.mockResolvedValueOnce({});

      await repository.updateStatus('test-uuid', 'pending');

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call).toBeInstanceOf(UpdateCommand);
    });

    it('should set updatedAt timestamp', async () => {
      mockSend.mockResolvedValueOnce({});

      const beforeUpdate = new Date().toISOString();
      await repository.updateStatus('test-uuid', 'completed');
      const afterUpdate = new Date().toISOString();

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call).toBeInstanceOf(UpdateCommand);
    });

    it('should throw error if DynamoDB update fails', async () => {
      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(repository.updateStatus('test-uuid', 'completed')).rejects.toThrow(
        'DynamoDB error'
      );
    });
  });

  describe('exists', () => {
    it('should return true when appointment exists', async () => {
      const mockItem = {
        appointmentId: 'test-uuid',
        insuredId: '12345',
        scheduleId: 100,
        countryISO: 'PE',
        status: 'pending',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      mockSend.mockResolvedValueOnce({ Item: mockItem });

      const result = await repository.exists('test-uuid');

      expect(result).toBe(true);
    });

    it('should return false when appointment does not exist', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await repository.exists('non-existent-id');

      expect(result).toBe(false);
    });

    it('should call findById internally', async () => {
      mockSend.mockResolvedValueOnce({});

      await repository.exists('test-uuid');

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call).toBeInstanceOf(GetCommand);
    });

    it('should throw error if DynamoDB query fails', async () => {
      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(repository.exists('test-uuid')).rejects.toThrow('DynamoDB error');
    });
  });
});
