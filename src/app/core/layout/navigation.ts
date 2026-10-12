export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export interface NavSection {
  title: string;
  items: readonly NavItem[];
}

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    title: 'العمليات',
    items: [
      { label: 'الرئيسية', path: '/dashboard', icon: 'fa-gauge-high' },
      { label: 'التقارير وسجل الرحلات', path: '/orders', icon: 'fa-chart-line' },
    ],
  },
  {
    title: 'الإدارة',
    items: [
      { label: 'العملاء', path: '/clients', icon: 'fa-users' },
      { label: 'المندوبين', path: '/deliverymen', icon: 'fa-motorcycle' },
      { label: 'المستخدمين', path: '/admins', icon: 'fa-user-shield' },
    ],
  },
];
