import { Component, input } from '@angular/core';
import { AbstractControl, Validators } from '@angular/forms';
import {
  getValidationMessage,
  ValidationMessageOverrides,
} from '../validation-messages';

/**
 * غلاف موحد لأي حقل في الفورم: label + الحقل + رسالة الخطأ أو التلميح.
 *
 *   <app-form-field label="اسم العميل" fieldId="name" [control]="form.controls.name">
 *     <input id="name" class="form-control" formControlName="name">
 *   </app-form-field>
 *
 * Default change detection مقصود: حالة الـ control (touched/errors) مش signals.
 */
@Component({
  selector: 'app-form-field',
  standalone: true,
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss',
})
export class FormFieldComponent {
  readonly label = input.required<string>();
  readonly fieldId = input<string>();
  readonly control = input<AbstractControl | null>(null);
  readonly hint = input<string>();
  readonly messages = input<ValidationMessageOverrides>({});

  protected get isRequired(): boolean {
    return this.control()?.hasValidator(Validators.required) ?? false;
  }

  protected get errorMessage(): string | null {
    const control = this.control();
    if (!control || !control.invalid || !(control.touched || control.dirty)) {
      return null;
    }
    return getValidationMessage(control.errors, this.messages());
  }
}
