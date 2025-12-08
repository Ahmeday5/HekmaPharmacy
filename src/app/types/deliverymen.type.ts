export interface allDeliverymen {
  id: number;
  name: string;
  email: string;
  password: string;
  isAvaliable: boolean;
  imageUrl?: string,
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
