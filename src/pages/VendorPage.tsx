import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listSefarim } from '../services/sefarim';
import { listVendorOrders } from '../services/orders';
import type { Order, Sefer } from '../types';
import { SeferForm } from '../components/vendor/SeferForm';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

type Tab = 'catalog' | 'orders';

export function VendorPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('catalog');
  const [sefarim, setSefarim] = useState<Sefer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  async function reload() {
    if (!profile) return;
    const [allSefarim, myOrders] = await Promise.all([listSefarim(), listVendorOrders(profile.uid)]);
    setSefarim(allSefarim.filter((s) => s.vendorListings.some((l) => l.vendorId === profile.uid)));
    setOrders(myOrders);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      <div className="mb-4 flex gap-2">
        <Button variant={tab === 'catalog' ? 'primary' : 'secondary'} onClick={() => setTab('catalog')}>
          {t('vendor.catalog')}
        </Button>
        <Button variant={tab === 'orders' ? 'primary' : 'secondary'} onClick={() => setTab('orders')}>
          {t('vendor.orders')}
        </Button>
      </div>

      {tab === 'catalog' ? (
        <div className="space-y-3">
          {sefarim.map((sefer) => {
            const listing = sefer.vendorListings.find((l) => l.vendorId === profile.uid);
            return (
              <Card key={sefer.seferId}>
                <p className="font-semibold">
                  {sefer.englishName} · {sefer.hebrewName}
                </p>
                <p className="text-sm text-text-muted">{t(`sefer.${sefer.type}`)}</p>
                <p className="text-sm">
                  ${listing?.price.toFixed(2)} — {listing?.inStock ? t('vendor.inStock') : '—'}
                </p>
              </Card>
            );
          })}

          {showAddForm ? (
            <SeferForm
              onSaved={() => {
                setShowAddForm(false);
                reload();
              }}
            />
          ) : (
            <Button onClick={() => setShowAddForm(true)}>{t('vendor.addSefer')}</Button>
          )}
        </div>
      ) : (
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
      )}
    </div>
  );
}
