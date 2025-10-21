import {
  validateRequired,
  validateCountryISO,
  validateInsuredId,
  validatePositiveNumber,
  validateUUID,
  parseBody,
  validateEmail,
  validateMaxLength,
  validateMinLength,
  validateEnum,
} from '../../../utils/validators';
import {
  MissingRequiredFieldError,
  InvalidCountryCodeError,
  InvalidInsuredIdError,
  InvalidRequestBodyError,
} from '../../../errors';

describe('Validators', () => {
  describe('validateRequired', () => {
    it('should not throw for valid object with all required fields', () => {
      const obj = {
        name: 'John',
        age: 30,
        email: 'john@example.com',
      };

      expect(() => validateRequired(obj, ['name', 'age', 'email'])).not.toThrow();
    });

    it('should throw MissingRequiredFieldError for undefined field', () => {
      const obj = {
        name: 'John',
        age: undefined,
      };

      expect(() => validateRequired(obj, ['name', 'age'])).toThrow(MissingRequiredFieldError);
    });

    it('should throw MissingRequiredFieldError for null field', () => {
      const obj = {
        name: 'John',
        age: null,
      };

      expect(() => validateRequired(obj, ['name', 'age'])).toThrow(MissingRequiredFieldError);
    });

    it('should throw MissingRequiredFieldError for empty string', () => {
      const obj = {
        name: '',
        age: 30,
      };

      expect(() => validateRequired(obj, ['name', 'age'])).toThrow(MissingRequiredFieldError);
    });

    it('should throw MissingRequiredFieldError with all missing fields', () => {
      const obj = {
        name: '',
        age: null,
        email: undefined,
      };

      try {
        validateRequired(obj, ['name', 'age', 'email']);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(MissingRequiredFieldError);
        expect((error as MissingRequiredFieldError).details.missingFields).toEqual([
          'name',
          'age',
          'email',
        ]);
      }
    });

    it('should accept 0 as valid number', () => {
      const obj = {
        count: 0,
      };

      expect(() => validateRequired(obj, ['count'])).not.toThrow();
    });

    it('should accept false as valid boolean', () => {
      const obj = {
        active: false,
      };

      expect(() => validateRequired(obj, ['active'])).not.toThrow();
    });
  });

  describe('validateCountryISO', () => {
    it('should accept PE as valid country', () => {
      expect(() => validateCountryISO('PE')).not.toThrow();
    });

    it('should accept CL as valid country', () => {
      expect(() => validateCountryISO('CL')).not.toThrow();
    });

    it('should throw InvalidCountryCodeError for invalid country', () => {
      expect(() => validateCountryISO('US')).toThrow(InvalidCountryCodeError);
    });

    it('should throw InvalidCountryCodeError for lowercase country code', () => {
      expect(() => validateCountryISO('pe')).toThrow(InvalidCountryCodeError);
    });

    it('should throw InvalidCountryCodeError for empty string', () => {
      expect(() => validateCountryISO('')).toThrow(InvalidCountryCodeError);
    });
  });

  describe('validateInsuredId', () => {
    it('should accept valid 5-digit insuredId', () => {
      expect(() => validateInsuredId('12345')).not.toThrow();
      expect(() => validateInsuredId('00000')).not.toThrow();
      expect(() => validateInsuredId('99999')).not.toThrow();
    });

    it('should throw InvalidInsuredIdError for 4-digit string', () => {
      expect(() => validateInsuredId('1234')).toThrow(InvalidInsuredIdError);
    });

    it('should throw InvalidInsuredIdError for 6-digit string', () => {
      expect(() => validateInsuredId('123456')).toThrow(InvalidInsuredIdError);
    });

    it('should throw InvalidInsuredIdError for non-numeric string', () => {
      expect(() => validateInsuredId('abcde')).toThrow(InvalidInsuredIdError);
    });

    it('should throw InvalidInsuredIdError for alphanumeric string', () => {
      expect(() => validateInsuredId('123a5')).toThrow(InvalidInsuredIdError);
    });

    it('should throw InvalidInsuredIdError for empty string', () => {
      expect(() => validateInsuredId('')).toThrow(InvalidInsuredIdError);
    });
  });

  describe('validatePositiveNumber', () => {
    it('should accept positive numbers', () => {
      expect(() => validatePositiveNumber(1, 'count')).not.toThrow();
      expect(() => validatePositiveNumber(100, 'amount')).not.toThrow();
      expect(() => validatePositiveNumber(0.5, 'rate')).not.toThrow();
    });

    it('should throw MissingRequiredFieldError for zero', () => {
      expect(() => validatePositiveNumber(0, 'count')).toThrow(MissingRequiredFieldError);
    });

    it('should throw MissingRequiredFieldError for negative numbers', () => {
      expect(() => validatePositiveNumber(-1, 'count')).toThrow(MissingRequiredFieldError);
    });

    it('should throw MissingRequiredFieldError for non-number', () => {
      expect(() => validatePositiveNumber('10' as any, 'count')).toThrow(
        MissingRequiredFieldError
      );
    });
  });

  describe('validateUUID', () => {
    it('should accept valid UUIDs', () => {
      expect(() => validateUUID('550e8400-e29b-41d4-a716-446655440000')).not.toThrow();
      expect(() => validateUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).not.toThrow();
    });

    it('should accept UUID with uppercase letters', () => {
      expect(() => validateUUID('550E8400-E29B-41D4-A716-446655440000')).not.toThrow();
    });

    it('should throw MissingRequiredFieldError for invalid UUID format', () => {
      expect(() => validateUUID('not-a-uuid')).toThrow(MissingRequiredFieldError);
    });

    it('should throw MissingRequiredFieldError for UUID without hyphens', () => {
      expect(() => validateUUID('550e8400e29b41d4a716446655440000')).toThrow(
        MissingRequiredFieldError
      );
    });

    it('should use custom field name in error', () => {
      try {
        validateUUID('invalid', 'appointmentId');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(MissingRequiredFieldError);
        expect((error as MissingRequiredFieldError).details.missingFields[0]).toContain(
          'appointmentId'
        );
      }
    });
  });

  describe('parseBody', () => {
    it('should parse valid JSON string', () => {
      const json = '{"name":"John","age":30}';
      const result = parseBody(json);

      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('should parse array JSON', () => {
      const json = '[1,2,3]';
      const result = parseBody(json);

      expect(result).toEqual([1, 2, 3]);
    });

    it('should throw InvalidRequestBodyError for empty body', () => {
      expect(() => parseBody('')).toThrow(InvalidRequestBodyError);
    });

    it('should throw InvalidRequestBodyError for undefined body', () => {
      expect(() => parseBody(undefined)).toThrow(InvalidRequestBodyError);
    });

    it('should throw InvalidRequestBodyError for null body', () => {
      expect(() => parseBody(null)).toThrow(InvalidRequestBodyError);
    });

    it('should throw InvalidRequestBodyError for invalid JSON', () => {
      expect(() => parseBody('not valid json')).toThrow(InvalidRequestBodyError);
    });

    it('should throw InvalidRequestBodyError for malformed JSON', () => {
      expect(() => parseBody('{"name":"John"')).toThrow(InvalidRequestBodyError);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      expect(() => validateEmail('user@example.com')).not.toThrow();
      expect(() => validateEmail('john.doe@company.co.uk')).not.toThrow();
      expect(() => validateEmail('test+tag@domain.org')).not.toThrow();
    });

    it('should throw MissingRequiredFieldError for invalid email format', () => {
      expect(() => validateEmail('invalid-email')).toThrow(MissingRequiredFieldError);
      expect(() => validateEmail('missing@domain')).toThrow(MissingRequiredFieldError);
      expect(() => validateEmail('@domain.com')).toThrow(MissingRequiredFieldError);
      expect(() => validateEmail('user@')).toThrow(MissingRequiredFieldError);
    });

    it('should use custom field name in error', () => {
      try {
        validateEmail('invalid', 'userEmail');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(MissingRequiredFieldError);
        expect((error as MissingRequiredFieldError).details.missingFields[0]).toContain(
          'userEmail'
        );
      }
    });
  });

  describe('validateMaxLength', () => {
    it('should accept strings within max length', () => {
      expect(() => validateMaxLength('hello', 10, 'name')).not.toThrow();
      expect(() => validateMaxLength('test', 4, 'code')).not.toThrow();
    });

    it('should throw MissingRequiredFieldError for strings exceeding max length', () => {
      expect(() => validateMaxLength('hello world', 5, 'name')).toThrow(
        MissingRequiredFieldError
      );
    });

    it('should include max length in error message', () => {
      try {
        validateMaxLength('toolong', 3, 'field');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(MissingRequiredFieldError);
        expect((error as MissingRequiredFieldError).details.missingFields[0]).toContain('3');
      }
    });
  });

  describe('validateMinLength', () => {
    it('should accept strings meeting min length', () => {
      expect(() => validateMinLength('hello', 3, 'name')).not.toThrow();
      expect(() => validateMinLength('test', 4, 'code')).not.toThrow();
    });

    it('should throw MissingRequiredFieldError for strings below min length', () => {
      expect(() => validateMinLength('hi', 5, 'name')).toThrow(MissingRequiredFieldError);
    });

    it('should include min length in error message', () => {
      try {
        validateMinLength('ab', 5, 'field');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(MissingRequiredFieldError);
        expect((error as MissingRequiredFieldError).details.missingFields[0]).toContain('5');
      }
    });
  });

  describe('validateEnum', () => {
    it('should accept values in allowed list', () => {
      expect(() => validateEnum('PE', ['PE', 'CL'], 'country')).not.toThrow();
      expect(() => validateEnum('CL', ['PE', 'CL'], 'country')).not.toThrow();
    });

    it('should throw MissingRequiredFieldError for values not in allowed list', () => {
      expect(() => validateEnum('US', ['PE', 'CL'], 'country')).toThrow(
        MissingRequiredFieldError
      );
    });

    it('should work with number enums', () => {
      expect(() => validateEnum(1, [1, 2, 3], 'status')).not.toThrow();
      expect(() => validateEnum(5, [1, 2, 3], 'status')).toThrow(MissingRequiredFieldError);
    });

    it('should include allowed values in error message', () => {
      try {
        validateEnum('INVALID', ['A', 'B', 'C'], 'option');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(MissingRequiredFieldError);
        const errorMessage = (error as MissingRequiredFieldError).details.missingFields[0];
        expect(errorMessage).toContain('A');
        expect(errorMessage).toContain('B');
        expect(errorMessage).toContain('C');
      }
    });
  });
});
