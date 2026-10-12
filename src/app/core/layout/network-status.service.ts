import { inject, Injectable, signal } from '@angular/core';
import { ToastService } from '../../shared/ui/toast/toast.service';

/** حالة الاتصال بالإنترنت + تنبيه لما يتقطع أو يرجع */
@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
  private readonly toast = inject(ToastService);
  private readonly _online = signal(navigator.onLine);
  readonly online = this._online.asReadonly();

  constructor() {
    window.addEventListener('online', () => {
      this._online.set(true);
      this.toast.success('تم استعادة الاتصال بالإنترنت', { title: 'متصل' });
    });
    window.addEventListener('offline', () => {
      this._online.set(false);
      this.toast.warning('انقطع الاتصال بالإنترنت، بعض البيانات قد لا تتحدث', { title: 'غير متصل' });
    });
  }
}
