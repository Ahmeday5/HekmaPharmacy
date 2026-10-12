import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoadingBarService } from './loading-bar.service';

/**
 * لطلبات الخلفية اللي مش محتاجة تظهر للمستخدم:
 *   this.http.get(url, { context: new HttpContext().set(SKIP_LOADING_BAR, true) })
 */
export const SKIP_LOADING_BAR = new HttpContextToken<boolean>(() => false);

export const loadingBarInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_LOADING_BAR)) {
    return next(req);
  }
  return next(req).pipe(inject(LoadingBarService).track());
};
