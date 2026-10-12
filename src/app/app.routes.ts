import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guards';
import { ShellComponent } from './core/layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'تسجيل الدخول',
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page.component').then((m) => m.LoginPageComponent),
  },

  // روابط النسخة القديمة — عشان أي bookmark قديم يفضل شغال
  { path: 'reportOrder', redirectTo: 'orders', pathMatch: 'full' },
  { path: 'editReportOrder/:id', redirectTo: 'orders' },
  { path: 'Clients', redirectTo: 'clients', pathMatch: 'full' },
  { path: 'editClient/:id', redirectTo: 'clients' },
  { path: 'Deliverymen', redirectTo: 'deliverymen', pathMatch: 'full' },
  { path: 'editDeliverymen/:id', redirectTo: 'deliverymen' },
  { path: 'Admins', redirectTo: 'admins', pathMatch: 'full' },
  { path: 'editAdmin/:id', redirectTo: 'admins' },

  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'الرئيسية',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
            (m) => m.DashboardPageComponent,
          ),
      },
      {
        path: 'orders',
        title: 'التقارير وسجل الرحلات',
        loadComponent: () =>
          import('./features/orders/pages/orders-page/orders-page.component').then((m) => m.OrdersPageComponent),
      },
      {
        path: 'clients',
        title: 'العملاء',
        loadComponent: () =>
          import('./features/clients/pages/clients-page/clients-page.component').then(
            (m) => m.ClientsPageComponent,
          ),
      },
      {
        path: 'deliverymen',
        title: 'المندوبين',
        loadComponent: () =>
          import('./features/deliverymen/pages/deliverymen-page/deliverymen-page.component').then(
            (m) => m.DeliverymenPageComponent,
          ),
      },
      {
        path: 'admins',
        title: 'المستخدمين',
        loadComponent: () =>
          import('./features/admins/pages/admins-page/admins-page.component').then((m) => m.AdminsPageComponent),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
