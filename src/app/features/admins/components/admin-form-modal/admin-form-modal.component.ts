import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppValidators } from '../../../../shared/forms/app-validators';
import { FormActionsComponent } from '../../../../shared/forms/form-actions/form-actions.component';
import { FormFieldComponent } from '../../../../shared/forms/form-field/form-field.component';
import { FormModalBase } from '../../../../shared/forms/form-modal.base';
import { PasswordInputComponent } from '../../../../shared/forms/password-input/password-input.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { Admin, ADMIN_ROLES } from '../../data-access/admin.models';
import { AdminsApi } from '../../data-access/admins.api';

@Component({
  selector: 'app-admin-form-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ModalComponent,
    FormFieldComponent,
    FormActionsComponent,
    PasswordInputComponent,
  ],
  templateUrl: './admin-form-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminFormModalComponent extends FormModalBase<Admin> implements OnInit {
  private readonly api = inject(AdminsApi);

  protected readonly roles = ADMIN_ROLES;
  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, AppValidators.strongPassword]],
    role: ['', Validators.required],
  });

  protected readonly messages = {
    created: 'تم إضافة المستخدم بنجاح',
    updated: 'تم تحديث بيانات المستخدم بنجاح',
    failed: 'تعذر حفظ بيانات المستخدم',
  };

  override ngOnInit(): void {
    // في التعديل كلمة المرور اختيارية — فاضية = الاحتفاظ بالقديمة
    if (this.entity()) {
      this.form.controls.password.removeValidators(Validators.required);
      this.form.controls.password.updateValueAndValidity();
    }
    super.ngOnInit();
  }

  protected patchForm(admin: Admin): void {
    this.form.patchValue({ email: admin.email, role: admin.role });
  }

  protected persist() {
    const { email, password, role } = this.form.getRawValue();
    const admin = this.entity();
    if (!admin) {
      return this.api.create({ email: email.trim(), password, role });
    }
    return this.api.update(admin.id, {
      email: email.trim(),
      role,
      ...(password ? { password } : {}),
    });
  }
}
