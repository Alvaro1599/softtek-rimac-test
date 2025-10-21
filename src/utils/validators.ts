import {
  MissingRequiredFieldError,
  InvalidCountryCodeError,
  InvalidInsuredIdError,
  InvalidRequestBodyError,
} from '../errors';

export function validateRequired<T extends Record<string, any>>(
  obj: T,
  requiredFields: (keyof T)[]
): void {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      missingFields.push(String(field));
    }
  }

  if (missingFields.length > 0) {
    throw new MissingRequiredFieldError(missingFields);
  }
}

export function validateCountryISO(countryISO: string): asserts countryISO is 'PE' | 'CL' {
  if (countryISO !== 'PE' && countryISO !== 'CL') {
    throw new InvalidCountryCodeError(countryISO);
  }
}

export function validateInsuredId(insuredId: string): void {
  if (!/^\d{5}$/.test(insuredId)) {
    throw new InvalidInsuredIdError(insuredId);
  }
}

export function validatePositiveNumber(value: any, fieldName: string): void {
  if (typeof value !== 'number' || value <= 0) {
    throw new MissingRequiredFieldError([`${fieldName} must be a positive number`]);
  }
}

export function validateUUID(value: string, fieldName: string = 'id'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new MissingRequiredFieldError([`${fieldName} must be a valid UUID`]);
  }
}

export function parseBody<T = any>(body: string | undefined | null): T {
  if (!body) {
    throw new InvalidRequestBodyError('Request body is empty');
  }

  try {
    return JSON.parse(body) as T;
  } catch (error) {
    throw new InvalidRequestBodyError(error instanceof Error ? error.message : 'Invalid JSON');
  }
}

export function validateEmail(email: string, fieldName: string = 'email'): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new MissingRequiredFieldError([`${fieldName} must be a valid email address`]);
  }
}

export function validateMaxLength(value: string, maxLength: number, fieldName: string): void {
  if (value.length > maxLength) {
    throw new MissingRequiredFieldError([
      `${fieldName} must not exceed ${maxLength} characters`,
    ]);
  }
}

export function validateMinLength(value: string, minLength: number, fieldName: string): void {
  if (value.length < minLength) {
    throw new MissingRequiredFieldError([
      `${fieldName} must be at least ${minLength} characters`,
    ]);
  }
}

export function validateEnum<T>(value: T, allowedValues: T[], fieldName: string): void {
  if (!allowedValues.includes(value)) {
    throw new MissingRequiredFieldError([
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
    ]);
  }
}
