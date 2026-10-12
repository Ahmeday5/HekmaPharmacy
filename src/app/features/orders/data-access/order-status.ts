export type OrderStatus = 'Pending' | 'InDelivery' | 'Delivered';

export interface OrderStatusMeta {
  label: string;
  badgeClass: string;
}

const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  Pending: { label: 'قيد الانتظار', badgeClass: 'badge-warning' },
  InDelivery: { label: 'جاري التوصيل', badgeClass: 'badge-info' },
  Delivered: { label: 'تم التوصيل', badgeClass: 'badge-success' },
};

// Firestore أو الـ API ممكن يرجعوا الحالة بحروف مختلفة (pending / Pending)
const STATUS_BY_LOWERCASE = new Map<string, OrderStatus>(
  (Object.keys(ORDER_STATUS_META) as OrderStatus[]).map((s) => [s.toLowerCase(), s]),
);

export function getOrderStatusMeta(status: string | null | undefined): OrderStatusMeta {
  const normalized = status ? STATUS_BY_LOWERCASE.get(status.trim().toLowerCase()) : undefined;
  return normalized
    ? ORDER_STATUS_META[normalized]
    : { label: status || '—', badgeClass: 'badge-neutral' };
}
