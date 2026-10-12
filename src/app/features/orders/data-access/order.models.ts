export interface Order {
  id: number;
  /** رقم الفاتورة */
  orderCode: string;
  amount: number;
  address: string;
  clientName: string;
  deliverymanName: string;
  /** الحالة كما في الداتا بيز الرئيسية — الحالة اللحظية بتيجي من Firestore */
  status: string;
  distance: number | null;
  orderDate: string;
  startedAt: string | null;
  endedAt: string | null;
  /** رابط الموقع الفعلي للتسليم */
  location: string;
  notes: string;
}

export type OrderFilters = {
  clientName: string;
  /** yyyy-MM-dd */
  orderDate: string;
};

export interface OrderPayload {
  orderCode: string;
  amount: number;
  address: string;
  clientId: number;
  deliveryManId: number;
  notes: string;
}

export interface UpdateOrderPayload extends OrderPayload {
  orderLocation: string;
}

/** طلب جاري توصيله (من Firestore) */
export interface InDeliveryOrder {
  id: string;
  orderCode: string;
  clientName: string;
  deliverymanName: string;
  address: string;
  amount: number | null;
}
