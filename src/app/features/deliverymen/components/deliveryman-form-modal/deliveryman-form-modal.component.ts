import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { apiAssetUrl } from '../../../../core/config/api.config';
import { AppValidators } from '../../../../shared/forms/app-validators';
import { FormActionsComponent } from '../../../../shared/forms/form-actions/form-actions.component';
import { FormFieldComponent } from '../../../../shared/forms/form-field/form-field.component';
import { FormModalBase } from '../../../../shared/forms/form-modal.base';
import { ImagePickerComponent } from '../../../../shared/forms/image-picker/image-picker.component';
import { PasswordInputComponent } from '../../../../shared/forms/password-input/password-input.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { Deliveryman } from '../../data-access/deliveryman.models';
import { DeliverymenApi } from '../../data-access/deliverymen.api';

const PASSWORD_MIN_LENGTH = 4;

@Component({
  selector: 'app-deliveryman-form-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ModalComponent,
    FormFieldComponent,
    FormActionsComponent,
    PasswordInputComponent,
    ImagePickerComponent,
  ],
  templateUrl: './deliveryman-form-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliverymanFormModalComponent extends FormModalBase<Deliveryman> implements OnInit {
  private readonly api = inject(DeliverymenApi);

  protected readonly form = inject(NonNullableFormBuilder).group({
    image: new FormControl<File | null>(null, Validators.required),
    name: ['', AppValidators.requiredText],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)]],
  });

  protected readonly messages = {
    created: 'تم إضافة المندوب بنجاح',
    updated: 'تم تحديث بيانات المندوب بنجاح',
    failed: 'تعذر حفظ بيانات المندوب',
  };

  protected readonly currentImageUrl = computed(() => apiAssetUrl(this.entity()?.imageUrl));

  override ngOnInit(): void {
    // في التعديل الصورة وكلمة المرور اختياريين — الفاضي = الاحتفاظ بالقديم
    if (this.entity()) {
      const { image, password } = this.form.controls;
      image.removeValidators(Validators.required);
      password.removeValidators(Validators.required);
      image.updateValueAndValidity();
      password.updateValueAndValidity();
    }
    super.ngOnInit();
  }

  protected patchForm(deliveryman: Deliveryman): void {
    this.form.patchValue({ name: deliveryman.name, email: deliveryman.email });
  }

  protected persist() {
    const { name, email, password, image } = this.form.getRawValue();
    const payload = { name: name.trim(), email: email.trim(), password, image };
    const deliveryman = this.entity();
    return deliveryman ? this.api.update(deliveryman.id, payload) : this.api.create(payload);
  }
}
