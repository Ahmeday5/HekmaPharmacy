import { HttpErrorResponse } from '@angular/common/http';
import { getErrorMessage } from './http-error.util';

const httpError = (status: number, error: unknown) => new HttpErrorResponse({ status, error });

describe('getErrorMessage', () => {
  it('uses a plain text body from the backend', () => {
    expect(getErrorMessage(httpError(400, 'Email already exists'), 'x')).toBe('Email already exists');
  });

  it('parses JSON returned as text (responseType: text)', () => {
    expect(getErrorMessage(httpError(400, '{"message":"Invalid code"}'), 'x')).toBe('Invalid code');
  });

  it('reads the first ASP.NET validation error', () => {
    const body = { title: 'One or more validation errors occurred.', errors: { Email: ['Email is required'] } };
    expect(getErrorMessage(httpError(400, body), 'x')).toBe('Email is required');
  });

  it('falls back to a status message when the body is empty or HTML', () => {
    expect(getErrorMessage(httpError(0, null), 'x')).toContain('تعذر الاتصال بالخادم');
    expect(getErrorMessage(httpError(500, '<html>error</html>'), 'x')).toContain('خطأ في الخادم');
  });

  it('uses the fallback for unknown errors', () => {
    expect(getErrorMessage({}, 'fallback')).toBe('fallback');
    expect(getErrorMessage(httpError(418, null), 'fallback')).toBe('fallback');
  });

  it('uses the message of regular errors', () => {
    expect(getErrorMessage(new Error('boom'), 'fallback')).toBe('boom');
  });
});
