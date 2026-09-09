import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { listVendorOrders, markOrderShipped } from '../../services/orders';
import type { Order } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function VendorOrdersTab() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    listVendorOrders(profile.uid).then((o) => {
      setOrders(o);
      setLoading(false);
    });
  }, [profile]);

  async function handleMarkShipped(orderId: string) {
    await markOrderShipped(orderId);
    setOrders((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, status: 'shipped' } : o)));
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-3">
      {orders.length === 0 ? (
        <p className="text-text-muted">{t('home.empty')}</p>
      ) : (
        orders.map((order) => (
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
              <p className="text-sm font-semibold">{order.status}</p>
              {order.status === 'pending' && (
                <Button variant="secondary" onClick={() => handleMarkShipped(order.orderId)}>
                  {t('vendor.markShipped')}
                </Button>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
