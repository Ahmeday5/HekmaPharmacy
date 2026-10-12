import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** يمنع دخول الصفحات المحمية من غير تسجيل دخول، ويرجع المستخدم لنفس الصفحة بعد الدخول */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** يمنع المستخدم المسجل من فتح صفحة الدخول */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn ? router.createUrlTree(['/dashboard']) : true;
};
