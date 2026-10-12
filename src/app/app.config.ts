import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { loadingBarInterceptor } from './core/loading/loading-bar.interceptor';
import { AppTitleStrategy } from './core/routing/app-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    // loadingBar أولًا عشان يغطي الطلب كله بما فيه إعادة المحاولة بعد تجديد التوكن
    provideHttpClient(withInterceptors([loadingBarInterceptor, authInterceptor])),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
  ],
};
