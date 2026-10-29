import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { acknowledgeVendorPurchaseOrder, listMyVendorPurchaseOrders, markVendorPurchaseOrderShipped } from '../../services/fulfillment';
import { listSefarim } from '../../services/sefarim';
import type { Sefer, VendorPurchaseOrder } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';

/** Vendor-only: purchase orders admin has sent (drafts stay invisible — see
 *  firestore.rules), with the two actions a vendor can take on one: ack
 *  that it arrived, then mark it shipped once the goods are on their way to us. */
export function VendorOrdersTab() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [orders, setOrders] = useState<VendorPurchaseOrder[]>([]);
  const [sefarim, setSefarim] = useState<Sefer[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    if (!profile?.uid) return;
    const [pos, sef] = await Promise.all([listMyVendorPurchaseOrders(profile.uid), listSefarim()]);
    setOrders(pos);
    setSefarim(sef);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid]);

  if (loading) return <LoadingSpinner />;

  const seferById = new Map(sefarim.map((s) => [s.seferId, s]));

  if (orders.length === 0) return <p className="text-text-muted">{t('vendor.poEmpty')}</p>;

  return (
    <div className="space-y-3">
      {orders.map((po) => (
        <Card key={po.vendorPurchaseOrderId} className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-text-muted">
              {po.items
                .map((item) => `${seferById.get(item.seferId)?.englishName ?? item.seferId} ×${item.quantity}`)
                .join(', ')}
            </p>
            <span className="shrink-0 rounded-btn bg-surface-alt px-2 py-1 text-xs font-medium">
              {t(`vendorPoFulfillmentStatus.${po.fulfillmentStatus}`)}
            </span>
          </div>
          {po.fulfillmentStatus === 'sent' && (
            <Button
              onClick={async () => {
                await acknowledgeVendorPurchaseOrder(po.vendorPurchaseOrderId);
                reload();
              }}
            >
              {t('vendor.acknowledgePo')}
            </Button>
          )}
          {po.fulfillmentStatus === 'acknowledged' && (
            <Button
              onClick={async () => {
                await markVendorPurchaseOrderShipped(po.vendorPurchaseOrderId);
                reload();
              }}
            >
              {t('vendor.markPoShipped')}
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}
