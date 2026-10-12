import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import {
  BehaviorSubject,
  distinctUntilChanged,
  firstValueFrom,
  map,
  Observable,
} from 'rxjs';
import { apiUrl } from '../config/api.config';
import { AuthSession, AuthUser, LoginRequest } from './auth.models';

// نفس المفاتيح القديمة عشان الجلسات الحالية تفضل شغالة بعد التحديث
const STORAGE_KEYS = {
  session: 'userData',
  token: 'token',
  loggedIn: 'isLoggedIn',
  savedEmail: 'savedEmail',
} as const;

/** نجدد الـ access token قبل انتهائه بدقيقتين */
const REFRESH_AHEAD_MS = 2 * 60 * 1000;

const AUTH_ENDPOINTS = ['/login-appuser', '/refresh', '/revoke'];

/** أسماء الـ claims في توكن ASP.NET Identity (المختصرة والكاملة) */
const CLAIMS = {
  email: ['email', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress', 'unique_name', 'sub'],
  name: ['name', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name', 'unique_name', 'given_name'],
  role: ['role', 'roles', 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
} as const;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authUrl = apiUrl('Auth');

  private readonly session$ = new BehaviorSubject<AuthSession | null>(
    readStoredSession(),
  );
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshInFlight: Promise<AuthSession> | null = null;

  readonly isLoggedIn$: Observable<boolean> = this.session$.pipe(
    map((session) => session !== null),
    distinctUntilChanged(),
  );

  readonly currentUser: Signal<AuthUser | null> = toSignal(
    this.session$.pipe(map((session) => (session ? decodeUser(session.accessToken) : null))),
    { requireSync: true },
  );

  constructor() {
    this.restoreSession();
  }

  get isLoggedIn(): boolean {
    return this.session$.value !== null;
  }

  get savedEmail(): string | null {
    return localStorage.getItem(STORAGE_KEYS.savedEmail);
  }

  getAccessToken(): string | null {
    return this.session$.value?.accessToken ?? null;
  }

  isAuthEndpoint(url: string): boolean {
    return url.startsWith(this.authUrl) && AUTH_ENDPOINTS.some((e) => url.includes(e));
  }

  async login(request: LoginRequest): Promise<void> {
    try {
      const session = await firstValueFrom(
        this.http.post<AuthSession>(`${this.authUrl}/login-appuser`, request),
      );
      this.setSession(session);
      if (request.rememberMe) {
        localStorage.setItem(STORAGE_KEYS.savedEmail, request.email);
      } else {
        localStorage.removeItem(STORAGE_KEYS.savedEmail);
      }
    } catch (error) {
      throw new Error(loginErrorMessage(error));
    }
  }

  /**
   * يجدد الـ access token. الطلبات المتزامنة بتشارك نفس الـ request
   * بدل ما كل طلب 401 يعمل refresh لوحده.
   */
  refresh(): Promise<AuthSession> {
    this.refreshInFlight ??= this.performRefresh().finally(() => {
      this.refreshInFlight = null;
    });
    return this.refreshInFlight;
  }

  logout(): void {
    const refreshToken = this.session$.value?.refreshToken;
    if (refreshToken) {
      // revoke بشكل fire-and-forget — الخروج المحلي ما يستناش الـ server
      this.http
        .post(`${this.authUrl}/revoke`, { refreshToken }, { responseType: 'text' })
        .subscribe({ error: () => undefined });
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  /** يُستدعى لما الجلسة تنتهي ومينفعش تتجدد */
  expireSession(): void {
    if (!this.isLoggedIn) {
      return;
    }
    this.clearSession();
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  private async performRefresh(): Promise<AuthSession> {
    const current = this.session$.value;
    if (!current?.refreshToken) {
      throw new Error('No refresh token');
    }
    const response = await firstValueFrom(
      this.http.post<AuthSession>(`${this.authUrl}/refresh`, {
        refreshToken: current.refreshToken,
      }),
    );
    const session: AuthSession = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAt: response.expiresAt || current.expiresAt,
    };
    this.setSession(session);
    return session;
  }

  private restoreSession(): void {
    const session = this.session$.value;
    if (!session) {
      return;
    }
    if (isPast(session.expiresAt)) {
      this.clearSession();
      return;
    }
    this.scheduleRefresh(session.accessToken);
  }

  private setSession(session: AuthSession): void {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
    localStorage.setItem(STORAGE_KEYS.token, session.accessToken);
    localStorage.setItem(STORAGE_KEYS.loggedIn, 'true');
    this.session$.next(session);
    this.scheduleRefresh(session.accessToken);
  }

  private clearSession(): void {
    this.cancelRefreshTimer();
    localStorage.removeItem(STORAGE_KEYS.session);
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.loggedIn);
    this.session$.next(null);
  }

  private scheduleRefresh(accessToken: string): void {
    this.cancelRefreshTimer();
    const expiresAt = getTokenExpiry(accessToken);
    const delay = expiresAt ? Math.max(expiresAt - Date.now() - REFRESH_AHEAD_MS, 0) : 0;
    this.refreshTimer = setTimeout(() => {
      this.refresh().catch(() => this.expireSession());
    }, delay);
  }

  private cancelRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

function readStoredSession(): AuthSession | null {
  if (localStorage.getItem(STORAGE_KEYS.loggedIn) !== 'true') {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session);
    const session = raw ? (JSON.parse(raw) as AuthSession) : null;
    return session?.accessToken && session.refreshToken ? session : null;
  } catch {
    return null;
  }
}

function getTokenExpiry(token: string): number | null {
  try {
    const { exp } = jwtDecode<{ exp?: number }>(token);
    return exp ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function decodeUser(token: string): AuthUser | null {
  try {
    const claims = jwtDecode<Record<string, unknown>>(token);
    const read = (keys: readonly string[]): string => {
      for (const key of keys) {
        const value = claims[key];
        const first = Array.isArray(value) ? value[0] : value;
        if (typeof first === 'string' && first) {
          return first;
        }
      }
      return '';
    };
    const email = read(CLAIMS.email);
    return { email, name: read(CLAIMS.name) || email.split('@')[0], role: read(CLAIMS.role) };
  } catch {
    return null;
  }
}

function isPast(isoDate: string | undefined): boolean {
  const time = isoDate ? Date.parse(isoDate) : NaN;
  return Number.isNaN(time) || time < Date.now();
}

function loginErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 400 || error.status === 401) {
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
    }
    if (error.status === 0) {
      return 'تعذر الاتصال بالخادم، تحقق من اتصال الإنترنت';
    }
  }
  return 'تعذر تسجيل الدخول، حاول مرة أخرى';
}
