import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { PaginationComponent } from '../../layout/pagination/pagination.component';
import { firstValueFrom } from 'rxjs';
import {
  allDeliverymen,
  DeliverymenResponse,
} from '../../../types/deliverymen.type';
@Component({
  selector: 'app-all-deliveryman',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PaginationComponent],
  templateUrl: './all-deliveryman.component.html',
  styleUrl: './all-deliveryman.component.scss',
})
export class AllDeliverymanComponent implements OnInit {
  @ViewChild('form') form!: NgForm;
  @ViewChild('form', { static: false, read: ElementRef })
  formElement!: ElementRef<HTMLFormElement>;
  @ViewChild('fileInput', { static: false })
  fileInput!: ElementRef<HTMLInputElement>;
  isLoadingForm: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  private emailSearchTimeout: any;
  selectedFile: File | null = null;

  deliverymen = {
    name: '',
    email: '',
    password: '',
    imageUrl: '',
  };

  /*****for table*****/
  Deliverymen: allDeliverymen[] = [];
  loading: boolean = true;
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalPages: number = 0;
  pages: [] = [];
  noDeliverymenMessage: string | null = null;
  DeliverymenMessage: string | null = null;
  totalItems: number = 0;
  Deliverymenname: string = '';
  Deliveremail: string = '';
  private searchTimeout: any;
  showPassword: boolean = false;
  selectedImage: string = '';

  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.fetchAllDeliverymen(
      this.currentPage,
      this.itemsPerPage,
      this.Deliverymenname,
      this.Deliveremail
    );
  }

  // دالة لعرض الصورة في الـ modal
  showImage(imageUrl?: string) {
    if (imageUrl) {
      this.selectedImage = `http://78.89.159.126:9393/PharmacyAPI${
        imageUrl.startsWith('/') ? '' : '/'
      }${imageUrl}`;
      this.cdr.detectChanges();
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      // معاينة الصورة (اختياري)
      const reader = new FileReader();
      reader.onload = () => {
        this.deliverymen.imageUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  private resetForm(formElement: HTMLFormElement): void {
    this.form.resetForm();

    // إفراغ الـ model
    this.deliverymen = { name: '', email: '', password: '', imageUrl: '' };
    this.selectedFile = null;

    // إفراغ الـ file input نفسه
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }

    formElement.classList.remove('was-validated');
  }

  async handleSubmit(): Promise<void> {
    const formElement = this.formElement.nativeElement;

    if (!formElement.checkValidity()) {
      formElement.classList.add('was-validated');
      this.form.control.markAllAsTouched();
      return;
    }

    if (!this.selectedFile) {
      this.errorMessage = 'يرجى اختيار صورة للمندوب';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isLoadingForm = true;

    const formData = new FormData();
    formData.append('name', this.deliverymen.name);
    formData.append('email', this.deliverymen.email);
    formData.append('password', this.deliverymen.password);
    formData.append('Image', this.selectedFile, this.selectedFile.name);

    try {
      const response = await firstValueFrom(
        this.apiService.addDeliverymen(formData)
      );
      console.log('Response from Add deliverymen API:', response);
      if (response.success) {
        this.successMessage = 'تم إضافة المندوب بنجاح';
        this.resetForm(formElement);
        this.deliverymen = {
          name: '',
          email: '',
          password: '',
          imageUrl: '',
        };
        formElement.classList.remove('was-validated');
        this.isLoadingForm = false;
        setTimeout(() => {
          this.successMessage = ''; // إفراغ رسالة النجاح بعد 3 ثواني
          this.fetchAllDeliverymen(
            this.currentPage,
            this.itemsPerPage,
            this.Deliverymenname,
            this.Deliveremail
          ); // تحديث الجدول
        }, 3000);
      } else {
        this.errorMessage = 'فشل في إضافة المندوب';
      }
    } catch (error: any) {
      this.isLoadingForm = false;
      let errorMessage = 'حدث خطأ أثناء الإضافة';
      if (error && error.message) {
        errorMessage = error.message;
      }
      this.errorMessage = errorMessage;
      console.error('خطأ في إضافة المندوب:', error);
    } finally {
      this.isLoadingForm = false; // إيقاف السبينر
    }
  }

  // دالة لجلب كل المندوبين (مع استدعاء getVisiblePages)
  fetchAllDeliverymen(
    page: number,
    pageSize: number,
    Deliverymenname: string,
    Deliveremail: string
  ) {
    this.loading = true;
    this.noDeliverymenMessage = null;
    this.DeliverymenMessage = null;

    const cleanDeliverymenname =
      Deliverymenname && Deliverymenname.trim() !== ''
        ? Deliverymenname
        : undefined;
    const cleanemail =
      Deliveremail && Deliveremail.trim() !== '' ? Deliveremail : undefined;

    this.apiService
      .getAllDeliverymen(page, pageSize, cleanDeliverymenname, cleanemail)
      .subscribe({
        next: (
          response: DeliverymenResponse | { error: boolean; message: string }
        ) => {
          console.log('API Response in Component:', response);
          if ('error' in response) {
            this.Deliverymen = [];
            this.noDeliverymenMessage = response.message;
            this.totalItems = 0;
            this.totalPages = 0;
            this.pages = [];
          } else {
            this.Deliverymen = response.items || [];
            this.totalItems = response.totalItems || 0;
            this.totalPages =
              response.totalPages || Math.ceil(this.totalItems / pageSize);
            this.currentPage = response.page || page;
            this.itemsPerPage = response.pageSize || pageSize;

            if (this.Deliverymen.length === 0) {
              if (cleanDeliverymenname && cleanemail) {
                this.noDeliverymenMessage = `اسم المندوب ${cleanDeliverymenname} لا يتطابق مع الايميل "${cleanemail}"`;
              } else if (cleanDeliverymenname) {
                this.noDeliverymenMessage = `لا يوجد اسم مندوب يطابق البحث "${cleanDeliverymenname}"`;
              } else if (cleanemail) {
                this.noDeliverymenMessage = `لا يوجد ايميل مندوب يطابق البحث "${cleanemail}"`;
              } else {
                this.noDeliverymenMessage = 'لا يوجد عملاء متاحة';
              }
            }
          }

          console.log('Extracted Deliverymen:', this.Deliverymen);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Unexpected error in fetchAllDeliverymen:', error);
          this.Deliverymen = [];
          this.noDeliverymenMessage = 'حدث خطأ غير متوقع في جلب المندوبين';
          this.totalItems = 0;
          this.totalPages = 0;
          this.pages = [];
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  // دالة لمعالجة إدخال البحث (بحث فوري مع debounce)
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();

    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.Deliverymenname = value;
      this.currentPage = 1;
      this.fetchAllDeliverymen(
        this.currentPage,
        this.itemsPerPage,
        this.Deliverymenname,
        this.Deliveremail
      );
    }, 300);
  }

  // دالة جديدة للبحث بالإيميل
  onEmailSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();

    // إلغاء أي تأخير سابق
    clearTimeout(this.emailSearchTimeout);

    // إضافة تأخير 300 مللي ثانية قبل إرسال طلب البحث
    this.emailSearchTimeout = setTimeout(() => {
      this.Deliveremail = value; // تحديث قيمة الإيميل
      this.currentPage = 1; // إعادة تعيين الصفحة للأولى
      this.fetchAllDeliverymen(
        this.currentPage,
        this.itemsPerPage,
        this.Deliverymenname,
        this.Deliveremail
      ); // استدعاء دالة جلب البيانات
    }, 300);
  }

  // دالة لتغيير الصفحة (مع التحقق من الـ Type)
  onPageChange(page: number | undefined): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchAllDeliverymen(
        this.currentPage,
        this.itemsPerPage,
        this.Deliverymenname,
        this.Deliveremail
      );
    }
  }

  deleteDeliverymen(id: number) {
    if (confirm('هل أنت متأكد من حذف هذه المندوب')) {
      this.loading = true;
      this.apiService.deleteDeliverymen(id).subscribe({
        next: (response) => {
          this.DeliverymenMessage = 'تم حذف المندوب بنجاح';
          setTimeout(() => {
            this.DeliverymenMessage = null;
            this.fetchAllDeliverymen(
              this.currentPage,
              this.itemsPerPage,
              this.Deliverymenname,
              this.Deliveremail
            );
          }, 2000);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error(`خطأ في حذف المندوب ${id}:`, error);
          this.noDeliverymenMessage = 'فشل حذف المندوب';
          this.loading = false;
          setTimeout(() => {
            this.noDeliverymenMessage = null;
          }, 2000);
          this.cdr.detectChanges();
        },
      });
    }
  }

  // دالة لتنسيق التاريخ
  formatDate(date: string): string {
    return date.split('T')[0]; // استخراج YYYY-MM-DD فقط
  }

  // دالة للذهاب لصفحة التعديل
  editDeliverymen(id: number) {
    this.router.navigate(['/editDeliverymen', id]);
  }
}
