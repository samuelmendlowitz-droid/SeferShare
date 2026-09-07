import type { Address } from './common';

export type OrderStatus = 'pending' | 'shipped' | 'delivered';

export interface OrderItem {
  seferId: string;
  quantity: number;
}

export interface Order {
  orderId: string;
  donationId: string;
  vendorId: string;
  items: OrderItem[];
  shippingAddress: Address;
  status: OrderStatus;
  createdAt: number;
}
