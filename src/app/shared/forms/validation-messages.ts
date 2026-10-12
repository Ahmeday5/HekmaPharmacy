import { ValidationErrors } from '@angular/forms';

/** الـ payload اللي Angular بيحطه مع كل error (زي requiredLength أو min) */
type ErrorPayload = { requiredLength?: number; min?: number; max?: number };
type MessageFactory = (error: ErrorPayload) => string;

/** رسائل التحقق الموحدة لكل الفورمز */
const DEFAULT_MESSAGES: Record<string, MessageFactory> = {
  required: () => 'هذا الحقل مطلوب',
  email: () => 'يرجى إدخال بريد إلكتروني صحيح',
  minlength: (e) => `يجب ألا يقل عن ${e.requiredLength} أحرف`,
  maxlength: (e) => `يجب ألا يزيد عن ${e.requiredLength} حرف`,
  min: (e) => `أقل قيمة مسموحة ${e.min}`,
  max: (e) => `أكبر قيمة مسموحة ${e.max}`,
  pattern: () => 'القيمة المدخلة غير صحيحة',
  whitespace: () => 'لا يمكن أن يكون الحقل مسافات فقط',
  url: () => 'يرجى إدخال رابط صحيح يبدأ بـ http أو https',
  phone: () => 'يرجى إدخال رقم هاتف صحيح',
  strongPassword: () => 'كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حرف كبير وحرف صغير ورقم ورمز خاص',
};

export type ValidationMessageOverrides = Partial<Record<string, string>>;

export function getValidationMessage(
  errors: ValidationErrors | null,
  overrides: ValidationMessageOverrides = {},
): string | null {
  if (!errors) {
    return null;
  }
  const [key, value] = Object.entries(errors)[0];
  return overrides[key] ?? DEFAULT_MESSAGES[key]?.(value) ?? 'القيمة المدخلة غير صحيحة';
}
