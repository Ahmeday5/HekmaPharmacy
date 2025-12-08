import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service'; // استيراد AuthService للحصول على التوكن
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private hubConnection!: signalR.HubConnection;
  private orderNotificationSubject = new BehaviorSubject<any>(null);
  orderNotification$ = this.orderNotificationSubject.asObservable();

  constructor(private authService: AuthService) {}

  // بدء الاتصال بـ SignalR Hub
  async startConnection(): Promise<void> {
    const token = this.authService.getToken();
    if (!token) {
      console.error('No token found for SignalR connection');
      return;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://78.89.159.126:9393/PharmacyAPI/hubs/notification', {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveOrderNotification', (order) => {
      console.log('New order received:', order);
      this.orderNotificationSubject.next(order);
    });

    // انتظار start() والتعامل مع الأخطاء
    try {
      await this.hubConnection.start();
      console.log('SignalR Connected');
    } catch (err) {
      console.error('Error while starting SignalR:', err);
      throw err; // لإعلام المستدعي أن الاتصال فشل
    }
  }

  // الانضمام إلى مجموعة الدليفري مان
  joinDeliveryManGroup(deliveryManId: number): void {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection
        .invoke('JoinDeliveryManGroup', deliveryManId)
        .then(() => console.log(`Joined DeliveryMan group: ${deliveryManId}`))
        .catch((err) => console.error('Error joining group:', err));
    } else {
      console.warn('SignalR connection not established yet');
    }
  }

  // الانضمام إلى مجموعة الأدمن
  async joinAdminGroup(): Promise<void> {
    if (!this.hubConnection) {
      console.warn('No hubConnection instance');
      return;
    }

    if (this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      console.warn('SignalR connection not established yet');
      return;
    }
    try {
      await this.hubConnection.invoke('JoinAdminGroup');
      console.log('Joined Admin group');
    } catch (err) {
      console.error('Error joining admin group:', err);
    }
  }

  // إيقاف الاتصال
  stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection
        .stop()
        .then(() => console.log('SignalR Disconnected'))
        .catch((err) => console.error('Error while stopping SignalR:', err));
    }
  }
}
