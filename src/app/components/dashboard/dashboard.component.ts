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
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import {
  allDeliverymen,
  DeliverymenResponse,
} from '../../types/deliverymen.type';
import { InDeliveryOrders } from '../../types/InDeliveryOrders.type';
import { RealtimeService } from '../../services/realtime.service'; //firebase
import { Subscription } from 'rxjs'; //firebase
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { GoogleMap, GoogleMapsModule, MapMarker } from '@angular/google-maps';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleMapsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private realtimeSubs: Subscription[] = []; // نخزن الاشتراكات لنبطلها لاحقًا

  @ViewChild('form') form!: NgForm;
  @ViewChild('form', { static: false, read: ElementRef })
  formElement!: ElementRef<HTMLFormElement>;
  isLoading: boolean = false;
  @ViewChild(GoogleMap) googleMap!: GoogleMap;

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

  // Google Maps vars
  apiLoaded = false;
  center: google.maps.LatLngLiteral = { lat: 30.0444, lng: 31.2357 };
  zoom = 12;
  markers: {
    position: google.maps.LatLngLiteral;
    label: string;
    title: string;
    info: string; // غيرت إلى غير optional، مع default
    icon?: string;
  }[] = [];

  constructor(
    private http: HttpClient,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private realtime: RealtimeService, // الحقن هنا
  ) {
    this.loadGoogleMapsApi();
  }

  private loadGoogleMapsApi(): void {
    if (typeof google !== 'undefined' && google.maps) {
      this.apiLoaded = true;
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.apiLoaded = true;
      this.cdr.detectChanges();
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      this.errorMessage = 'فشل تحميل الخريطة، تحقق من الإنترنت أو المفتاح.';
    };
    document.head.appendChild(script);
  }

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
    this.loading = true;

    // 1. استمع للمندوبين من Firestore (للـ real-time)
    const sub1 = this.realtime
      .getDeliverymen()
      .subscribe(async (firestoreData) => {
        this.Deliverymen = firestoreData.map((d) => ({
          id: d.id,
          name: d.name,
          isAvaliable: d.isAvaliable ?? false,
          imageUrl: d.imageUrl,
          deviceToken: d.deviceToken || null, // لو موجود في Firestore، استخدمه
          lat: d.lat ?? 30.0444, // إضافة lat من Firebase
          lng: d.lng ?? 31.2357, // إضافة lng من Firebase
        }));

        // 2. جيب deviceToken من backend وخزنه في Firestore + في الـ array
        try {
          const backendResponse = await firstValueFrom(
            this.apiService.getAllDeliverymen(1, 100),
          ); // جيب كلهم
          const backendMap = new Map(
            backendResponse.items.map((item: any) => [
              item.id,
              item.deviceToken,
            ]),
          );

          for (const deliveryman of this.Deliverymen) {
            const backendToken = backendMap.get(Number(deliveryman.id));
            if (backendToken && deliveryman.deviceToken !== backendToken) {
              // خزن في Firestore
              await this.realtime.updateDeliverymanToken(
                deliveryman.id.toString(),
                backendToken,
              );
              // حدث في الـ array
              deliveryman.deviceToken = backendToken;
            }
          }

          // حدث availableDeliveryMan
          this.availableDeliveryMan = this.Deliverymen.filter(
            (d) => d.isAvaliable,
          ).map((d) => ({ id: d.id as number, name: d.name }));
        } catch (error) {
          console.error('خطأ في جلب deviceToken من backend:', error);
        }

        this.updateMarkers();
        this.loading = false;
        this.cdr.detectChanges();
      });
    this.realtimeSubs.push(sub1);

    // باقي الاشتراكات (InDeliveryOrders) زي ما هي
    const sub2 = this.realtime.getInDeliveryOrders().subscribe((orders) => {
      this.InDeliveryOrders = (orders || []).map((o) => ({
        orderId: o.id,
        clientName: o.clientName || o.clientId,
        deliveryManName: o.deliveryManName || o.assignedDriverName,
        amount: o.amount,
        address: o.address,
      }));
      this.cdr.detectChanges();
    });
    this.realtimeSubs.push(sub2);

    this.fetchClients();
  }

  private updateMarkers(): void {
    this.markers = this.Deliverymen.map((d) => ({
      position: { lat: d.lat || 30.0444, lng: d.lng || 31.2357 },
      label: d.name.charAt(0),
      title: `${d.name} (${d.isAvaliable ? 'جاهز' : 'غير متاح'})`,
      info: `ID: ${d.id}, Token: ${d.deviceToken ? 'متاح' : 'غير متاح'}`, // default string
      icon: d.isAvaliable
        ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
        : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    }));
    this.cdr.detectChanges();
  }

  // دالة للضغط على marker (بالفعل عندك openInfo)
  openInfo(event: google.maps.MapMouseEvent | null, content: string) {
    if (!event || !event.latLng || !this.googleMap?.googleMap) {
      console.warn('No map or latLng available');
      return;
    }

    const infoWindow = new google.maps.InfoWindow({
      content: `<h3>${content}</h3>`,
      position: event.latLng,
    });

    // افتح الـ InfoWindow على الـ map نفسه
    infoWindow.open({
      map: this.googleMap.googleMap, // هنا نستخدم الـ map reference
    });
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
          this.apiService.getAllClients(page, pageSize),
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
          (d) => Number(d.id) === +this.order.deliveryManId,
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
          orderCode: this.order.orderCode, // تأكد من إرسال orderCode لـ Firestore
          notes: this.order.notes || '', // تأكد من إرسال الملاحظات لـ Firestore
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
        response: DeliverymenResponse | { error: boolean; message: string },
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
        this.apiService.getInDeliveryOrders(),
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

  /********************************************************************** */
  // دالة لما تضغط على الجرس بجانب المندوب المتاح
  async sendBell(deliverymanId: number | string) {
    if (!confirm('هل تريد ارسال اشعار للمندوب؟')) {
      return;
    }

    const deliveryman = this.Deliverymen.find((d) => d.id === deliverymanId);

    if (!deliveryman) {
      alert('حدث خطأ، المندوب غير موجود في القائمة حاليًا.');
      return;
    }

    if (!deliveryman.deviceToken) {
      // رسالة ودية وواضحة بدل "مفيش device token"
      alert(
        `المندوب "${deliveryman.name}" غير متصل حاليًا بالتطبيق.\n\nيرجى الانتظار حتى يقوم بفتح التطبيق على موبايله، ثم يمكنك إرسال التنبيه.`,
      );
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      const body = {
        deviceToken: deliveryman.deviceToken,
        title: 'طلبية جاهزة!',
        body: 'اذهب لاستلام الطلبية من الصيدلية علي الفور',
      };

      const response = await firstValueFrom(
        this.apiService.sendNotification(body),
      );
      this.successMessage = `تم إرسال التنبيه بنجاح للمندوب "${deliveryman.name}"`;
      setTimeout(() => (this.successMessage = ''), 4000);
    } catch (error: any) {
      this.errorMessage = `فشل إرسال التنبيه إلى "${deliveryman.name}" \nممكن يكون موبايله مقفل أو مفيش نت، حاول مرة اخري بعد قليل .`;
      setTimeout(() => {
        this.errorMessage = '';
      }, 4000);
      console.error(error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}
