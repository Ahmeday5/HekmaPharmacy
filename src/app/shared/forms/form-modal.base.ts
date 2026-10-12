import {
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { isObservable, lastValueFrom, Observable } from 'rxjs';
import { getErrorMessage } from '../../core/http/http-error.util';
import { ToastService } from '../ui/toast/toast.service';

let formIdCounter = 0;

/**
 * الأساس المشترك لكل مودالز الإضافة/التعديل.
 * الكلاس الوارث بيعرّف: form + persist() + الرسائل، والباقي (validation، حالة الحفظ،
 * الـ toasts، الأحداث) موحد هنا.
 *
 *   entity = null  → وضع الإضافة
 *   entity = {...} → وضع التعديل (patchForm بيتنده تلقائي)
 */
@Directive()
export abstract class FormModalBase<TEntity> implements OnInit {
  readonly entity = input<TEntity | null>(null);
  readonly closed = output<void>();
  readonly saved = output<void>();

  protected abstract readonly form: FormGroup;
  protected abstract readonly messages: {
    created: string;
    updated: string;
    failed: string;
  };

  protected readonly formId = `entity-form-${++formIdCounter}`;
  protected readonly saving = signal(false);
  protected readonly isEdit = computed(() => this.entity() !== null);

  protected readonly toast = inject(ToastService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** يحفظ البيانات (إضافة أو تعديل حسب isEdit) */
  protected abstract persist(): Observable<unknown> | Promise<unknown>;

  /** يملأ الفورم بالبيانات الحالية في وضع التعديل */
  protected abstract patchForm(entity: TEntity): void;

  ngOnInit(): void {
    const entity = this.entity();
    if (entity) {
      this.patchForm(entity);
    }
  }

  protected async submit(): Promise<void> {
    if (this.saving()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    this.saving.set(true);
    try {
      const result = this.persist();
      await (isObservable(result) ? lastValueFrom(result, { defaultValue: undefined }) : result);
      this.toast.success(this.isEdit() ? this.messages.updated : this.messages.created);
      this.saved.emit();
    } catch (error) {
      this.toast.error(getErrorMessage(error, this.messages.failed));
    } finally {
      this.saving.set(false);
    }
  }

  protected close(): void {
    if (!this.saving()) {
      this.closed.emit();
    }
  }

  private focusFirstInvalidField(): void {
    // ننتظر الـ render عشان رسايل الخطأ تظهر الأول
    queueMicrotask(() =>
      this.host.nativeElement
        .querySelector<HTMLElement>('input.ng-invalid, select.ng-invalid, textarea.ng-invalid, .ng-invalid input')
        ?.focus(),
    );
  }
}
