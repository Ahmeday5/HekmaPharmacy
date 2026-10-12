export interface Deliveryman {
  id: number;
  name: string;
  email: string;
  isAvailable: boolean;
  imageUrl: string | null;
  /** FCM token — موجود بس لو المندوب فاتح التطبيق على موبايله */
  deviceToken: string | null;
}

/** المندوب كما يظهر live من Firestore (فيه الموقع) */
export interface LiveDeliveryman extends Deliveryman {
  lat: number | null;
  lng: number | null;
}

export type DeliverymanFilters = {
  name: string;
  email: string;
};

export interface DeliverymanPayload {
  name: string;
  email: string;
  /** إجباري في الإضافة، اختياري في التعديل */
  password?: string;
  image?: File | null;
}
