import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { apiUrl } from '../config/api.config';

export interface PushNotification {
  deviceToken: string;
  title: string;
  body: string;
}

/** إرسال Push notification لجهاز عن طريق الـ backend (FCM) */
@Injectable({ providedIn: 'root' })
export class PushNotificationsApi {
  private readonly http = inject(HttpClient);

  send(notification: PushNotification): Observable<void> {
    return this.http
      .post(apiUrl('Notification/send'), notification, { responseType: 'text' })
      .pipe(map(() => undefined));
  }
}
