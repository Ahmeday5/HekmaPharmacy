import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AppValidators } from '../../../../shared/forms/app-validators';
import { FormActionsComponent } from '../../../../shared/forms/form-actions/form-actions.component';
import { FormFieldComponent } from '../../../../shared/forms/form-field/form-field.component';
import { FormModalBase } from '../../../../shared/forms/form-modal.base';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { trimStrings } from '../../../../shared/utils/object.util';
import { Client } from '../../data-access/client.models';
import { ClientsApi } from '../../data-access/clients.api';

@Component({
  selector: 'app-client-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, FormFieldComponent, FormActionsComponent],
  templateUrl: './client-form-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientFormModalComponent extends FormModalBase<Client> {
  private readonly api = inject(ClientsApi);

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', AppValidators.requiredText],
    clientCode: ['', AppValidators.requiredText],
    phoneNumber: ['', [...AppValidators.requiredText, AppValidators.phone]],
    phoneNumber02: ['', AppValidators.phone],
    address: ['', AppValidators.requiredText],
    address02: [''],
    location: ['', AppValidators.requiredText],
  });

  protected readonly messages = {
    created: 'تم إضافة العميل بنجاح',
    updated: 'تم تحديث بيانات العميل بنجاح',
    failed: 'تعذر حفظ بيانات العميل',
  };

  protected patchForm(client: Client): void {
    this.form.patchValue(client);
  }

  protected persist() {
    const payload = trimStrings(this.form.getRawValue());
    const client = this.entity();
    return client ? this.api.update(client.id, payload) : this.api.create(payload);
  }
}

