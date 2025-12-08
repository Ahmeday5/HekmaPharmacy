import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import {
  allDeliverymen,
  DeliverymenResponse,
} from '../../types/deliverymen.type';
import { InDeliveryOrders } from '../../types/InDeliveryOrders.type';
import { RealtimeService } from '../../services/realtime.service'; //firebase
import { Subscription } from 'rxjs'; //firebase

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private realtimeSubs: Subscription[] = []; // نخزن الاشتراكات لنبطلها لاحقًا

  @ViewChild('form') form!: NgForm;
  @ViewChild('form', { static: false, read: ElementRef })
  formElement!: ElementRef<HTMLFormElement>;
  isLoading: boolean = false;

  /*******allDeliverymen*********/
  noDeliverymenMessage: string | null = null;
  Deliverymen: allDeliverymen[] = [];
  loading: boolean = true;

  /********getInDeliveryOrders******/
  InDeliveryOrders: InDeliveryOrders[] = [];

  /****************/
  order = {
    amount: '',
    address: '',
    deliveryManId: 0,
    clientId: 0,
    orderCode: '',
    notes: '',
  };
  availableDeliveryMan: { id: number; name: string }[] = [];
  Clients: {
    id: number;
    name: string;
    phoneNumber: string;
    location: string;
  }[] = [];
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private http: HttpClient,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private realtime: RealtimeService // الحقن هنا
  ) {}

  // دالة لعرض الصورة في الـ modal
  showImage() {
    this.cdr.detectChanges();
  }

  getFullImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl) {
      return '/assets/img/logo.jpg'; // صورة افتراضية
    }

    // إذا كان المسار كامل (يبدأ بـ http) رجعه كما هو
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    // إذا كان نسبي، أضف الـ base URL
    const baseUrl = 'http://78.89.159.126:9393/PharmacyAPI';
    return `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  onImageError(event: any) {
    event.target.src = 'assets/images/default-avatar.png'; // fallback
  }

  async ngOnInit(): Promise<void> {
    // الاستماع للمندوبين من Firestore لحظياً:
    const sub1 = this.realtime.getDeliverymen().subscribe(
      (data) => {
        // البيانات هنا عبارة عن مصفوفة من المستندات
        // تأكد أن الحقول تتطابق (مثلاً isAvailable أو isAvaliable حسب اللي في DB)
        this.Deliverymen = data.map((d) => ({
          id: d.id,
          name: d.name,
          email: d.email,
          password: d.password,
          isAvaliable: d.isAvaliable ?? false,
          imageUrl: d.imageUrl, // أضف هذا الحقل
        }));
        this.loading = false;
        this.cdr.detectChanges();
      },
      (err) => {
        console.error('Realtime deliverymen error:', err);
      }
    );
    this.realtimeSubs.push(sub1);

    // الاستماع للطلبات قيد التوصيل (مثال: status = 'in_delivery' أو حسب ما عندك)
    const sub2 = this.realtime.getInDeliveryOrders().subscribe(
      (orders) => {
        // حلّل orders إلى InDeliveryOrders إذا احتجت
        this.InDeliveryOrders = (orders || []).map((o) => ({
          orderId: o.id,
          clientName: o.clientName || o.clientId,
          deliveryManName: o.deliveryManName || o.assignedDriverName,
          amount: o.amount,
          address: o.address,
        }));
        this.cdr.detectChanges();
      },
      (err) => {
        console.error('Realtime InDelivery orders error:', err);
      }
    );
    this.realtimeSubs.push(sub2);

    // عرض الدليفري مان المتاحين فقط في السيليكت
    const sub3 = this.realtime.getAvailableDeliverymen().subscribe(
      (data) => {
        // البيانات هنا عبارة عن مصفوفة من المستندات
        // تأكد أن الحقول تتطابق (مثلاً isAvailable أو isAvaliable حسب اللي في DB)
        this.availableDeliveryMan = data.map((d) => ({
          id: d.id,
          name: d.name,
        }));
        this.loading = false;
        this.cdr.detectChanges();
      },
      (err) => {
        console.error('Realtime availableDeliveryMan error:', err);
      }
    );
    this.realtimeSubs.push(sub3);

    // لاحظ أننا لم نعد بحاجة لاستدعاء fetchAllDeliverymen() إذا اعتمدت كلياً على Firestore

    //this.fetchAvailableDeliveryMan();
    this.fetchClients();
    //this.fetchAllDeliverymen();
    //this.fetchInDeliveryOrders();
  }

  ngOnDestroy(): void {
    // الغاء كل الاشتراكات للـ Firestore لمنع memory leaks
    this.realtimeSubs.forEach((s) => s.unsubscribe());
  }

  /*async fetchAvailableDeliveryMan(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.apiService.getAvailableDeliveryMen()
      );
      console.log('DeliveryMen Response:', response);
      this.availableDeliveryMan = response || [];
    } catch (error) {
      console.error('فشل في جلب الدليفري:', error);
    }
  }*/

  async fetchClients(): Promise<void> {
    this.Clients = [];
    try {
      let allClients: any[] = [];
      let page = 1;
      const pageSize = 50; // أي رقم معقول (50-200)
      let totalPages = 1;
      do {
        const response = await firstValueFrom(
          this.apiService.getAllClients(page, pageSize)
        );

        // أضف العملاء من الصفحة الحالية
        if (Array.isArray(response.items)) {
          allClients.push(...response.items);
        }

        // حدّث عدد الصفحات
        totalPages = response.totalPages || 1;
        page++;

        // تأخير بسيط (اختياري) عشان ما نضغطش على السيرفر
        await new Promise((r) => setTimeout(r, 50));
      } while (page <= totalPages);

      this.Clients = allClients;
      console.log(`تم جلب ${this.Clients.length} عميل بنجاح`);
    } catch (error) {
      console.error('فشل في جلب العملاء:', error);
      this.Clients = [];
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /*async handleSubmit(): Promise<void> {
    const formElement = this.formElement.nativeElement;

    if (!formElement.checkValidity()) {
      formElement.classList.add('was-validated');
      this.form.control.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const body = {
      amount: this.order.amount,
      address: this.order.address,
      deliveryManId: this.order.deliveryManId,
      clientId: this.order.clientId,
    };

    try {
      const response = await firstValueFrom(this.apiService.addOrder(body));
      console.log('Response from Add Order API:', response);
      if (response.success) {
        this.successMessage = response.message;
        await this.realtime.addOrder({
          id: response.data.id,
          clientId: this.order.clientId,
          clientName:
            this.Clients.find((c) => c.id === +this.order.clientId)?.name || '',
          deliveryManId: this.order.deliveryManId,
          deliveryManName:
            this.availableDeliveryMan.find(
              (d) => d.id === +this.order.deliveryManId
            )?.name || '',
          amount: Number(this.order.amount),
          address: this.order.address,
          status: 'pending',
        });
        this.form.resetForm();
        this.order = {
          amount: '',
          address: '',
          deliveryManId: 0,
          clientId: 0,
        };
        formElement.classList.remove('was-validated');
        this.isLoading = false;
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
        this.fetchInDeliveryOrders();
      } else {
        this.errorMessage = 'فشل في إضافة الطلب';
        this.isLoading = false;
      }
    } catch (error: any) {
      this.isLoading = false;
      let errorMessage = 'حدث خطأ أثناء الإضافة';
      if (error && 'message' in error) {
        errorMessage = error.message;
      }
      this.errorMessage = errorMessage;
      console.error('خطأ في إضافة الطلب:', error);
    }
  }

  // دالة لجلب كل المندوبين (مع استدعاء getVisiblePages)
  fetchAllDeliverymen() {
    this.loading = true;
    this.noDeliverymenMessage = null;

    this.apiService.getAllDeliverymen(1, 3).subscribe({
      next: (
        response: DeliverymenResponse | { error: boolean; message: string }
      ) => {
        console.log('API Response in Component deliveryDashboard:', response);
        if ('error' in response) {
          this.Deliverymen = [];
          if (this.Deliverymen.length === 0) {
            this.noDeliverymenMessage = 'لا يوجد مندوبين متاحين';
          }
          this.noDeliverymenMessage = response.message;
        } else {
          this.Deliverymen = response.items || [];
        }

        console.log('Extracted Deliverymen:', this.Deliverymen);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Unexpected error in fetchAllDeliverymen:', error);
        this.Deliverymen = [];
        this.noDeliverymenMessage = 'حدث خطأ غير متوقع في جلب المندوبين';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }*/

  async handleSubmit(): Promise<void> {
    const formElement = this.formElement.nativeElement;
    if (!formElement.checkValidity()) {
      formElement.classList.add('was-validated');
      this.form.control.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    const body = {
      amount: this.order.amount,
      address: this.order.address,
      deliveryManId: this.order.deliveryManId,
      clientId: this.order.clientId,
      orderCode: this.order.orderCode,
      notes: this.order.notes,
    };

    try {
      const newOrderId = await this.apiService.addOrderAndGetId(body);
      console.log('New Order ID:', newOrderId);

      if (newOrderId) {
        // جيب الاسم من Deliverymen (اللي محدث من Firestore)
        const deliveryMan = this.Deliverymen.find(
          (d) => Number(d.id) === +this.order.deliveryManId
        );
        const deliveryManName = deliveryMan?.name || 'غير معروف';

        const client = this.Clients.find((c) => c.id === +this.order.clientId);
        const clientName = client?.name || 'غير معروف';
        const clientLocation = client?.location || '';
        const clientPhone = client?.phoneNumber || '';

        await this.realtime.addOrder({
          id: newOrderId,
          clientId: this.order.clientId,
          clientName,
          clientLocation,
          clientphoneNumber: clientPhone,
          deliveryManId: this.order.deliveryManId,
          deliveryManName, // الاسم هنا مضمون
          amount: Number(this.order.amount),
          address: this.order.address,
          status: 'Pending',
        });

        this.successMessage = 'تمت إضافة الطلب بنجاح';
        this.resetForm(formElement);
        this.isLoading = false;
        setTimeout(() => (this.successMessage = ''), 3000);
      } else {
        throw new Error('لم يتم العثور على معرف الطلب');
      }
    } catch (error: any) {
      this.isLoading = false;
      this.errorMessage = error.message || 'فشل في إضافة الطلب';
      console.error('خطأ:', error);
    }
  }

  private resetForm(formElement: HTMLFormElement) {
    this.form.resetForm();
    this.order = {
      amount: '',
      address: '',
      deliveryManId: 0,
      clientId: 0,
      notes: '',
      orderCode: '',
    };
    formElement.classList.remove('was-validated');
  }

  // 👇 دالة جلب كل المندوبين (بدون تغيير كبير)
  fetchAllDeliverymen() {
    this.loading = true;
    this.noDeliverymenMessage = null;

    this.apiService.getAllDeliverymen(1, 3).subscribe({
      next: (
        response: DeliverymenResponse | { error: boolean; message: string }
      ) => {
        console.log('API Response in Component deliveryDashboard:', response);
        if ('error' in response) {
          this.Deliverymen = [];
          if (this.Deliverymen.length === 0) {
            this.noDeliverymenMessage = 'لا يوجد مندوبين متاحين';
          }
          this.noDeliverymenMessage = response.message;
        } else {
          this.Deliverymen = response.items || [];
        }

        console.log('Extracted Deliverymen:', this.Deliverymen);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Unexpected error in fetchAllDeliverymen:', error);
        this.Deliverymen = [];
        this.noDeliverymenMessage = 'حدث خطأ غير متوقع في جلب المندوبين';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  //دالة لجلب الطلبات قيد التوصيل
  async fetchInDeliveryOrders(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const response = await firstValueFrom(
        this.apiService.getInDeliveryOrders()
      );
      this.InDeliveryOrders = response || [];
      if (this.InDeliveryOrders.length === 0) {
        this.errorMessage = 'لا يوجد مستخدم متاحين';
      }
      console.log('كل المستخدم:', this.InDeliveryOrders);
      this.loading = false;
    } catch (error: any) {
      console.error('فشل في جلب المستخدم:', error);
      this.errorMessage = error.message || 'حدث خطأ أثناء جلب المستخدم';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
