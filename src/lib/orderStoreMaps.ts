import type { Order } from '@/types';

/** Map API payment method string to the subset stored on {@link Order} for UI. */
export function mapPaymentMethodForStore(m: string): Order['paymentMethod'] {
  const u = (m || '').toUpperCase();
  if (u === 'CARD' || u === 'CREDIT_CARD' || u === 'NET_BANKING') return 'card';
  if (u === 'UPI') return 'upi';
  return 'cod';
}

/**
 * Map backend {@code OrderStatus} to the simplified status used on My Orders.
 * PLACED / CONFIRMED → processing; SHIPPED / OUT_FOR_DELIVERY → shipped; etc.
 */
export function mapOrderStatusForStore(s: string | undefined | null): Order['status'] {
  const u = (s || '').toUpperCase();
  if (u === 'DELIVERED') return 'delivered';
  if (u === 'CANCELLED' || u === 'RETURNED') return 'cancelled';
  if (u === 'SHIPPED' || u === 'OUT_FOR_DELIVERY') return 'shipped';
  return 'processing';
}
