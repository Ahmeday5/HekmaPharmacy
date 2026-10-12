import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%?&])[A-Za-z\d@$!%?&]{8,}$/;
const PHONE = /^\+?[0-9\s-]{7,20}$/;
const URL = /^https?:\/\/\S+$/i;

const isEmpty = (value: unknown): boolean =>
  value === null || value === undefined || value === '';

/** Validators مخصصة للمشروع — بتتجاهل القيم الفاضية (استخدم Validators.required معاها لو الحقل إجباري) */
export class AppValidators {
  /** يمنع إدخال مسافات بس في حقل إجباري */
  static notBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    return typeof value === 'string' && value.length > 0 && value.trim().length === 0
      ? { whitespace: true }
      : null;
  };

  static phone: ValidatorFn = (control) =>
    isEmpty(control.value) || PHONE.test(String(control.value)) ? null : { phone: true };

  static url: ValidatorFn = (control) =>
    isEmpty(control.value) || URL.test(String(control.value)) ? null : { url: true };

  static strongPassword: ValidatorFn = (control) =>
    isEmpty(control.value) || STRONG_PASSWORD.test(String(control.value))
      ? null
      : { strongPassword: true };

  /** إجباري ومش مسافات فاضية */
  static requiredText: ValidatorFn[] = [Validators.required, AppValidators.notBlank];
}
