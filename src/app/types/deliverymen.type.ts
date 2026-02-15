export interface allDeliverymen {
  id: number;
  name: string;
  email?: string; // اجعلها اختيارية
  password?: string; // اجعلها اختيارية
  isAvaliable: boolean;
  imageUrl?: string;
  deviceToken?: string | null;
  lat?: number; // ← أضف ده (إحداثيات الموقع)
  lng?: number; // ← أضف ده
}

export interface DeliverymenResponse {
  items: allDeliverymen[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  errorMessage?: string;
}

export interface UpdateDeliverymenResponse {
  success: boolean;
  message: string;
  data?: allDeliverymen;
}
