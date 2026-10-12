import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { map, Observable } from 'rxjs';
import { AppValidators } from '../../../../shared/forms/app-validators';
import { FormActionsComponent } from '../../../../shared/forms/form-actions/form-actions.component';
import { FormFieldComponent } from '../../../../shared/forms/form-field/form-field.component';
import { FormModalBase } from '../../../../shared/forms/form-modal.base';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { Client } from '../../../clients/data-access/client.models';
import { ClientsApi } from '../../../clients/data-access/clients.api';
import { Deliveryman } from '../../../deliverymen/data-access/deliveryman.models';
import { DeliverymenApi } from '../../../deliverymen/data-access/deliverymen.api';
import { DeliverymenRealtimeService } from '../../../deliverymen/data-access/deliverymen-realtime.service';
import { Order, OrderPayload } from '../../data-access/order.models';
import { OrdersApi } from '../../data-access/orders.api';
import { OrdersService } from '../../data-access/orders.service';

@Component({
  selector: 'app-order-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, FormFieldComponent, FormActionsComponent],
  templateUrl: './order-form-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderFormModalComponent extends FormModalBase<Order> implements OnInit {
  private readonly ordersApi = inject(OrdersApi);
  private readonly ordersService = inject(OrdersService);
  private readonly clientsApi = inject(ClientsApi);
  private readonly deliverymenApi = inject(DeliverymenApi);
  private readonly deliverymenRealtime = inject(DeliverymenRealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly clients = signal<Client[]>([]);
  protected readonly deliverymen = signal<Deliveryman[]>([]);
  protected readonly loadingClients = signal(true);
  protected readonly loadingDeliverymen = signal(true);

  protected readonly form = inject(NonNullableFormBuilder).group({
    orderCode: ['', AppValidators.requiredText],
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    clientId: new FormControl<number | null>(null, Validators.required),
    deliveryManId: new FormControl<number | null>(null, Validators.required),
    address: ['', AppValidators.requiredText],
    orderLocation: [''],
    notes: [''],
  });

  protected readonly messages = {
    created: 'تم إنشاء الطلب وإرساله للمندوب',
    updated: 'تم تحديث بيانات الطلب بنجاح',
    failed: 'تعذر حفظ الطلب',
  };

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadClients();
    this.loadDeliverymen();
    if (!this.isEdit()) {
      this.prefillAddressFromClient();
    }
  }

  protected patchForm(order: Order): void {
    this.form.patchValue({
      orderCode: order.orderCode,
      amount: order.amount,
      address: order.address,
      orderLocation: order.location,
      notes: order.notes,
    });
  }

  protected persist(): Observable<unknown> | Promise<unknown> {
    const value = this.form.getRawValue();
    const payload: OrderPayload = {
      orderCode: value.orderCode.trim(),
      amount: Number(value.amount),
      address: value.address.trim(),
      clientId: Number(value.clientId),
      deliveryManId: Number(value.deliveryManId),
      notes: value.notes.trim(),
    };

    const order = this.entity();
    if (order) {
      return this.ordersApi.update(order.id, { ...payload, orderLocation: value.orderLocation.trim() });
    }

    const client = this.clients().find((c) => c.id === payload.clientId);
    const deliveryman = this.deliverymen().find((d) => d.id === payload.deliveryManId);
    if (!client || !deliveryman) {
      return Promise.reject(new Error('يرجى اختيار العميل والمندوب من القائمة'));
    }
    return this.ordersService.create({ payload, client, deliveryman });
  }

  private loadClients(): void {
    this.clientsApi
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (clients) => {
          this.clients.set(clients);
          this.loadingClients.set(false);
          this.selectByName('clientId', clients, this.entity()?.clientName);
        },
        error: () => {
          this.loadingClients.set(false);
          this.toast.error('تعذر تحميل قائمة العملاء');
        },
      });
  }

  /**
   * الإضافة: المندوبين المتاحين بس (live من Firestore).
   * التعديل: كل المندوبين من الـ API عشان الطلبات القديمة.
   */
  private loadDeliverymen(): void {
    const source$ = this.isEdit()
      ? this.deliverymenApi.getAll()
      : this.deliverymenRealtime.watchAll().pipe(map((list) => list.filter((d) => d.isAvailable)));

    source$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (deliverymen) => {
        this.deliverymen.set(deliverymen);
        this.loadingDeliverymen.set(false);
        this.selectByName('deliveryManId', deliverymen, this.entity()?.deliverymanName);
      },
      error: () => {
        this.loadingDeliverymen.set(false);
        this.toast.error('تعذر تحميل قائمة المندوبين');
      },
    });
  }

  /** الـ API بيرجع اسم العميل/المندوب في الطلب مش الـ id — بنطابق بالاسم في وضع التعديل */
  private selectByName(
    control: 'clientId' | 'deliveryManId',
    options: { id: number; name: string }[],
    name: string | undefined,
  ): void {
    if (!name || this.form.controls[control].value !== null) {
      return;
    }
    const match = options.find((option) => option.name === name);
    if (match) {
      this.form.controls[control].setValue(match.id);
    }
  }

  /** عند اختيار العميل نملأ العنوان بعنوانه لو المستخدم لسه ما كتبش عنوان */
  private prefillAddressFromClient(): void {
    const { clientId, address } = this.form.controls;
    clientId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => {
      const client = this.clients().find((c) => c.id === id);
      if (client?.address && !address.dirty) {
        address.setValue(client.address);
      }
    });
  }
}
