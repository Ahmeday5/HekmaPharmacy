export const ADMIN_ROLES = [
  { value: 'Admin', label: 'مدير (Admin)' },
  { value: 'Editor', label: 'محرر (Editor)' },
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number]['value'];

/** يوحد شكل الدور (admin / ADMIN → Admin) عشان يطابق اختيارات الفورم */
export function normalizeAdminRole(role: string): string {
  return ADMIN_ROLES.find((r) => r.value.toLowerCase() === role.toLowerCase())?.value ?? role;
}

export function adminRoleLabel(role: string): string {
  return ADMIN_ROLES.find((r) => r.value === role)?.label ?? (role || 'بدون دور');
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
