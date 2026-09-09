import { useTranslation } from 'react-i18next';
import type { Order } from '../../types';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface SalesTabProps {
  loading: boolean;
  orders: Order[];
}

export function SalesTab({ loading, orders }: SalesTabProps) {
  const { t } = useTranslation();

  if (loading) return <LoadingSpinner />;

  const totalRevenue = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + (i.priceEach ?? 0) * i.quantity, 0),
    0,
  );
  const totalItemsSold = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-text-muted">{t('vendor.totalRevenue')}</p>
          <p className="text-xl font-bold">${totalRevenue.toFixed(2)}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-muted">{t('vendor.itemsSold')}</p>
          <p className="text-xl font-bold">{totalItemsSold}</p>
        </Card>
      </div>

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
                    {item.quantity}× {item.seferId} — ${((item.priceEach ?? 0) * item.quantity).toFixed(2)}
                  </li>
                ))}
              </ul>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
