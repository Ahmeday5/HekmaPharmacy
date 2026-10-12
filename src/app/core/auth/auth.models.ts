export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  /** تاريخ انتهاء الـ refresh token */
  expiresAt: string;
}

/** بيانات المستخدم الحالي من الـ access token */
export interface AuthUser {
  name: string;
  email: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}
