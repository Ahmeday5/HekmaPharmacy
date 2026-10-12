export const ADMIN_ROLES = [
  { value: 'Admin', label: 'مدير (Admin)', shortLabel: 'مدير' },
  { value: 'Editor', label: 'محرر (Editor)', shortLabel: 'محرر' },
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number]['value'];

/** يوحد شكل الدور (admin / ADMIN → Admin) عشان يطابق اختيارات الفورم */
export function normalizeAdminRole(role: string): string {
  return ADMIN_ROLES.find((r) => r.value.toLowerCase() === role.toLowerCase())?.value ?? role;
}

/** الاسم المختصر للدور (للجداول والفلاتر) */
export function adminRoleLabel(role: string): string {
  return ADMIN_ROLES.find((r) => r.value === role)?.shortLabel ?? (role || 'بدون دور');
}

export interface Admin {
  /** UUID */
  id: string;
  userName: string;
  email: string;
  role: string;
}

export type AdminFilters = {
  search: string;
  /** '' = كل الأدوار */
  role: string;
};

export interface CreateAdminPayload {
  email: string;
  password: string;
  role: string;
}

export interface UpdateAdminPayload {
  email: string;
  role: string;
  /** لو مش موجود الـ backend بيحتفظ بكلمة المرور القديمة */
  password?: string;
}
