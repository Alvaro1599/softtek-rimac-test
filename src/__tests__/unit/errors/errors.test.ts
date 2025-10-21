import {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  InternalError,
  ServiceUnavailableError,
  MethodNotAllowedError,
  InvalidCountryCodeError,
  InvalidInsuredIdError,
  MissingRequiredFieldError,
  AppointmentNotFoundError,
  InvalidRequestBodyError,
  isOperationalError,
} from '../../../errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with all properties', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR', { detail: 'test' });

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.isOperational).toBe(true);
    });

    it('should default isOperational to true', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');

      expect(error.isOperational).toBe(true);
    });

    it('should allow setting isOperational to false', () => {
      const error = new AppError('Test error', 500, 'TEST_ERROR', undefined, false);

      expect(error.isOperational).toBe(false);
    });

    it('should be instance of Error', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with correct status code', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('should accept details', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = new ValidationError('Invalid input', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with default message', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should accept custom message', () => {
      const error = new NotFoundError('User not found');

      expect(error.message).toBe('User not found');
    });
  });

  describe('ConflictError', () => {
    it('should create conflict error', () => {
      const error = new ConflictError('Resource already exists');

      expect(error.message).toBe('Resource already exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create unauthorized error with default message', () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should accept custom message', () => {
      const error = new UnauthorizedError('Invalid credentials');

      expect(error.message).toBe('Invalid credentials');
    });
  });

  describe('ForbiddenError', () => {
    it('should create forbidden error with default message', () => {
      const error = new ForbiddenError();

      expect(error.message).toBe('Forbidden');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should accept custom message', () => {
      const error = new ForbiddenError('Access denied');

      expect(error.message).toBe('Access denied');
    });
  });

  describe('InternalError', () => {
    it('should create internal error with default message', () => {
      const error = new InternalError();

      expect(error.message).toBe('Internal server error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(false);
    });

    it('should accept custom message', () => {
      const error = new InternalError('Database connection failed');

      expect(error.message).toBe('Database connection failed');
    });

    it('should be non-operational by default', () => {
      const error = new InternalError();

      expect(error.isOperational).toBe(false);
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should create service unavailable error with default message', () => {
      const error = new ServiceUnavailableError();

      expect(error.message).toBe('Service temporarily unavailable');
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
    });

    it('should accept custom message', () => {
      const error = new ServiceUnavailableError('Under maintenance');

      expect(error.message).toBe('Under maintenance');
    });
  });

  describe('MethodNotAllowedError', () => {
    it('should create method not allowed error without allowed methods', () => {
      const error = new MethodNotAllowedError();

      expect(error.message).toBe('HTTP method not allowed');
      expect(error.statusCode).toBe(405);
      expect(error.code).toBe('METHOD_NOT_ALLOWED');
      expect(error.details).toBeUndefined();
    });

    it('should include allowed methods in details', () => {
      const error = new MethodNotAllowedError(['GET', 'POST']);

      expect(error.details).toEqual({ allowedMethods: ['GET', 'POST'] });
    });
  });

  describe('InvalidCountryCodeError', () => {
    it('should create invalid country code error', () => {
      const error = new InvalidCountryCodeError('US');

      expect(error.message).toBe('Invalid country code');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('INVALID_COUNTRY_CODE');
      expect(error.details).toEqual({
        countryCode: 'US',
        allowedValues: ['PE', 'CL'],
      });
    });
  });

  describe('InvalidInsuredIdError', () => {
    it('should create invalid insured ID error', () => {
      const error = new InvalidInsuredIdError('123');

      expect(error.message).toBe('Invalid insured ID format');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('INVALID_INSURED_ID');
      expect(error.details).toEqual({
        insuredId: '123',
        expectedFormat: '5-digit numeric string',
      });
    });
  });

  describe('MissingRequiredFieldError', () => {
    it('should create missing required field error with single field', () => {
      const error = new MissingRequiredFieldError(['email']);

      expect(error.message).toBe('Missing required fields');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('MISSING_REQUIRED_FIELDS');
      expect(error.details).toEqual({
        missingFields: ['email'],
      });
    });

    it('should create error with multiple fields', () => {
      const error = new MissingRequiredFieldError(['name', 'email', 'phone']);

      expect(error.details).toEqual({
        missingFields: ['name', 'email', 'phone'],
      });
    });
  });

  describe('AppointmentNotFoundError', () => {
    it('should create appointment not found error', () => {
      const error = new AppointmentNotFoundError('test-uuid');

      expect(error.message).toBe('Appointment not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('APPOINTMENT_NOT_FOUND');
      expect(error.details).toEqual({
        appointmentId: 'test-uuid',
      });
    });
  });

  describe('InvalidRequestBodyError', () => {
    it('should create invalid request body error without parse error', () => {
      const error = new InvalidRequestBodyError();

      expect(error.message).toBe('Invalid request body format');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('INVALID_REQUEST_BODY');
      expect(error.details).toEqual({ parseError: undefined });
    });

    it('should include parse error in details', () => {
      const parseError = 'Unexpected token';
      const error = new InvalidRequestBodyError(parseError);

      expect(error.details).toEqual({ parseError: 'Unexpected token' });
    });
  });

  describe('isOperationalError', () => {
    it('should return true for operational errors', () => {
      const error = new ValidationError('Test');

      expect(isOperationalError(error)).toBe(true);
    });

    it('should return false for non-operational errors', () => {
      const error = new InternalError();

      expect(isOperationalError(error)).toBe(false);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Regular error');

      expect(isOperationalError(error)).toBe(false);
    });

    it('should return false for non-Error objects', () => {
      const error = { message: 'Not an error' };

      expect(isOperationalError(error as any)).toBe(false);
    });
  });
});
