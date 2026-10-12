import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AuthService } from './auth.service';

/**
 * يضيف الـ Bearer token لطلبات الـ API بتاعتنا بس (مش Firebase أو أي دومين تاني)،
 * ولو رجع 401 بيجدد التوكن مرة واحدة ويعيد الطلب.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  if (!req.url.startsWith(API_BASE_URL) || auth.isAuthEndpoint(req.url)) {
    return next(req);
  }

  const token = auth.getAccessToken();

  return next(withToken(req, token)).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !token) {
        return throwError(() => error);
      }
      return from(auth.refresh()).pipe(
        catchError(() => {
          auth.expireSession();
          return throwError(() => error);
        }),
        switchMap((session) => next(withToken(req, session.accessToken))),
      );
    }),
  );
};

function withToken<T>(req: HttpRequest<T>, token: string | null): HttpRequest<T> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}
