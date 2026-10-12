import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** حقل كلمة مرور مع زر إظهار/إخفاء — بيشتغل مع formControlName عادي */
@Component({
  selector: 'app-password-input',
  standalone: true,
  template: `
    <div class="password-wrapper">
      <input
        class="form-control"
        [type]="visible() ? 'text' : 'password'"
        [id]="inputId()"
        [placeholder]="placeholder()"
        [attr.autocomplete]="autocomplete()"
        [value]="value()"
        [disabled]="disabled()"
        (input)="onInput($any($event.target).value)"
        (blur)="onTouched()"
      />
      <button
        type="button"
        class="password-toggle"
        (click)="visible.set(!visible())"
        [attr.aria-label]="visible() ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'"
        [attr.aria-pressed]="visible()"
        tabindex="-1"
      >
        <i class="fa-regular" [class.fa-eye]="!visible()" [class.fa-eye-slash]="visible()"></i>
      </button>
    </div>
  `,
  styles: `
    .password-wrapper {
      position: relative;
    }
    .form-control {
      padding-inline-end: 2.75rem;
    }
    .password-toggle {
      position: absolute;
      inset-block: 0;
      inset-inline-end: 0.25rem;
      width: 2.375rem;
      border: 0;
      background: transparent;
      color: var(--color-text-muted);
    }
    .password-toggle:hover {
      color: var(--color-primary);
    }
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordInputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordInputComponent implements ControlValueAccessor {
  readonly inputId = input<string>();
  readonly placeholder = input('••••••••');
  readonly autocomplete = input('new-password');

  protected readonly visible = signal(false);
  protected readonly value = signal('');
  protected readonly disabled = signal(false);

  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onInput(value: string): void {
    this.value.set(value);
    this.onChange(value);
  }
}
