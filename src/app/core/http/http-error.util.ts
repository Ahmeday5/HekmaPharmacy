import { HttpErrorResponse } from '@angular/common/http';

const STATUS_MESSAGES: Record<number, string> = {
  0: 'تعذر الاتصال بالخادم، تحقق من اتصال الإنترنت',
  401: 'انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى',
  403: 'ليس لديك صلاحية لتنفيذ هذا الإجراء',
  404: 'العنصر المطلوب غير موجود',
  500: 'حدث خطأ في الخادم، حاول مرة أخرى لاحقًا',
};

/**
 * يستخرج رسالة خطأ مفهومة من أي خطأ (HTTP أو غيره).
 * بيدعم الأشكال اللي بيرجعها الـ backend: نص، { message }، وASP.NET ProblemDetails.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    return extractBodyMessage(error.error) ?? STATUS_MESSAGES[error.status] ?? fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function extractBodyMessage(body: unknown): string | null {
  if (typeof body === 'string') {
    const text = body.trim();
    if (!text) {
      return null;
    }
    try {
      return extractBodyMessage(JSON.parse(text));
    } catch {
      // نص عادي مش JSON — بنتجاهل صفحات HTML الطويلة
      return text.startsWith('<') ? null : text;
    }
  }

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record['message'] === 'string' && record['message']) {
      return record['message'];
    }
    const errors = record['errors'];
    if (errors && typeof errors === 'object') {
      const first = Object.values(errors as Record<string, unknown>).flat()[0];
      if (typeof first === 'string') {
        return first;
      }
    }
    if (typeof record['title'] === 'string' && record['title']) {
      return record['title'];
    }
  }
  return null;
}
