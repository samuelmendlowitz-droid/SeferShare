import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { markOrderShipped } from '../../services/orders';
import type { Order } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface VendorOrdersTabProps {
  loading: boolean;
  orders: Order[];
}

export function VendorOrdersTab({ loading, orders: initialOrders }: VendorOrdersTabProps) {
  const { t } = useTranslation();
  const [shippedIds, setShippedIds] = useState<Set<string>>(new Set());

  async function handleMarkShipped(orderId: string) {
    await markOrderShipped(orderId);
    setShippedIds((prev) => new Set(prev).add(orderId));
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-3">
      {initialOrders.length === 0 ? (
        <p className="text-text-muted">{t('home.empty')}</p>
      ) : (
        initialOrders.map((order) => {
          const status = shippedIds.has(order.orderId) ? 'shipped' : order.status;
          return (
            <Card key={order.orderId}>
              <p className="text-sm text-text-muted">{new Date(order.createdAt).toLocaleDateString()}</p>
              <ul className="mt-1 text-sm">
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    {item.quantity}× {item.seferId}
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm font-semibold">{t(`orderStatus.${status}`)}</p>
                {status === 'pending' && (
                  <Button variant="secondary" onClick={() => handleMarkShipped(order.orderId)}>
                    {t('vendor.markShipped')}
                  </Button>
                )}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
