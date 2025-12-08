export interface InDeliveryOrders {
  id?: string | number;
  orderId?: string | number;
  clientId?: string | number;
  assignedDriverName?: string;
  clientName?: string | number;
  deliveryManName?: string;
  amount?: number;
  address?: string;
}

export type InDeliveryOrdersResponse = InDeliveryOrders[];
