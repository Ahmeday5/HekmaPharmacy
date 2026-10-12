import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LoadingButtonComponent } from '../../ui/loading-button/loading-button.component';

/**
 * أزرار الحفظ والإلغاء الموحدة لأي فورم داخل مودال.
 * زر الحفظ مربوط بالفورم بالـ id (attribute form) فينفع يتحط في footer المودال.
 */
@Component({
  selector: 'app-form-actions',
  standalone: true,
  imports: [LoadingButtonComponent],
  template: `
    <button type="submit" appLoadingButton class="btn btn-brand-primary" [attr.form]="formId()" [loading]="saving()">
      <i class="fa-solid fa-check" aria-hidden="true"></i>
      {{ submitLabel() }}
    </button>
    <button type="button" class="btn btn-brand-light" (click)="cancel.emit()" [disabled]="saving()">
      {{ cancelLabel() }}
    </button>
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormActionsComponent {
  readonly formId = input.required<string>();
  readonly saving = input(false);
  readonly submitLabel = input('حفظ');
  readonly cancelLabel = input('إلغاء');

  readonly cancel = output<void>();
}
