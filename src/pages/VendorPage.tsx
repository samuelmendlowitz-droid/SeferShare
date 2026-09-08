import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listVendorOrders } from '../services/orders';
import type { Order } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function VendorPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!profile) return;
    listVendorOrders(profile.uid).then(setOrders);
  }, [profile]);

  if (!profile?.isVendor || !profile.vendorApproved) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <p className="text-text-muted">Not authorized.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <Button variant="secondary" className="mb-4" onClick={() => navigate('/profile')}>
        {t('actions.back')}
      </Button>

      <h1 className="mb-4 text-xl font-bold">{t('vendor.orders')}</h1>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <p className="text-text-muted">{t('home.empty')}</p>
        ) : (
          orders.map((order) => (
            <Card key={order.orderId}>
              <p className="text-sm text-text-muted">{new Date(order.createdAt).toLocaleDateString()}</p>
              <p className="text-sm font-semibold">{order.status}</p>
              <ul className="mt-1 text-sm">
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    {item.quantity}× {item.seferId}
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
