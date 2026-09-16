import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { markOrderFulfilled, markOrderShipped, resetOrderToPending } from '../../services/orders';
import { downloadCsv, ordersToCsv } from '../../lib/orderCsv';
import type { Order, OrderStatus, Sefer } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { DownloadIcon } from '../ui/icons';

interface VendorOrdersTabProps {
  loading: boolean;
  orders: Order[];
  sefarimById: Map<string, Sefer>;
}

const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  pending: 'bg-accent/10 text-accent',
  shipped: 'bg-accent-soft/10 text-accent-soft',
  delivered: 'bg-success/10 text-success',
};

export function VendorOrdersTab({ loading, orders, sefarimById }: VendorOrdersTabProps) {
  const { t } = useTranslation();
  // Optimistic per-order status, layered over the fetched list so the button/badge
  // update immediately without waiting on a refetch from the parent.
  const [statusOverrides, setStatusOverrides] = useState<Map<string, OrderStatus>>(new Map());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const ordersWithStatus = useMemo(
    () => orders.map((o) => ({ ...o, status: statusOverrides.get(o.orderId) ?? o.status })),
    [orders, statusOverrides],
  );

  function setStatus(orderId: string, status: OrderStatus) {
    setStatusOverrides((prev) => new Map(prev).set(orderId, status));
  }

  /** The single status button cycles pending -> shipped -> delivered -> pending;
   *  only the last (fulfilled-to-pending) step needs a confirmation, since it's
   *  the one an accidental extra tap could otherwise silently undo. */
  async function handleAdvance(order: Order & { status: OrderStatus }) {
    if (order.status === 'pending') {
      await markOrderShipped(order.orderId);
      setStatus(order.orderId, 'shipped');
    } else if (order.status === 'shipped') {
      await markOrderFulfilled(order.orderId);
      setStatus(order.orderId, 'delivered');
    } else {
      if (!window.confirm(t('vendor.confirmResetOrder') ?? '')) return;
      await resetOrderToPending(order.orderId);
      setStatus(order.orderId, 'pending');
    }
  }

  function toggleSelected(orderId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === ordersWithStatus.length ? new Set() : new Set(ordersWithStatus.map((o) => o.orderId)),
    );
  }

  function handleDownloadOne(order: Order) {
    downloadCsv(`order-${order.orderId}.csv`, ordersToCsv([order], sefarimById));
  }

  function handleBulkDownload() {
    const selected = ordersWithStatus.filter((o) => selectedIds.has(o.orderId));
    downloadCsv(`orders-${new Date().toISOString().slice(0, 10)}.csv`, ordersToCsv(selected, sefarimById));
  }

  async function handleBulkMarkShipped() {
    const pendingSelected = ordersWithStatus.filter((o) => selectedIds.has(o.orderId) && o.status === 'pending');
    await Promise.all(pendingSelected.map((o) => markOrderShipped(o.orderId)));
    pendingSelected.forEach((o) => setStatus(o.orderId, 'shipped'));
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-3">
      {ordersWithStatus.length === 0 ? (
        <p className="text-text-muted">{t('home.empty')}</p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 rounded-btn border border-border bg-surface px-3 py-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={selectedIds.size > 0 && selectedIds.size === ordersWithStatus.length}
                onChange={toggleSelectAll}
              />
              {selectedIds.size > 0 ? t('vendor.ordersSelected', { count: selectedIds.size }) : t('vendor.selectAll')}
            </label>
            {selectedIds.size > 0 && (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleBulkMarkShipped}>
                  {t('vendor.markShipped')}
                </Button>
                <Button variant="secondary" onClick={handleBulkDownload}>
                  {t('vendor.downloadCsv')}
                </Button>
              </div>
            )}
          </div>

          {ordersWithStatus.map((order) => (
            <Card key={order.orderId}>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 shrink-0"
                  checked={selectedIds.has(order.orderId)}
                  onChange={() => toggleSelected(order.orderId)}
                  aria-label={t('vendor.selectAll') ?? ''}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-text-muted">{new Date(order.createdAt).toLocaleDateString()}</p>
                    <span className={`rounded-pill px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[order.status]}`}>
                      {t(`orderStatus.${order.status}`)}
                    </span>
                  </div>
                  <ul className="mt-1 space-y-0.5 text-sm">
                    {order.items.map((item, idx) => {
                      const sefer = sefarimById.get(item.seferId);
                      return (
                        <li key={idx}>
                          {item.quantity}× {sefer?.englishName ?? item.seferId}
                          {sefer?.hebrewName ? ` · ${sefer.hebrewName}` : ''}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadOne(order)}
                      className="flex shrink-0 items-center gap-1 rounded-btn border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:border-accent hover:text-accent"
                    >
                      <DownloadIcon width={14} height={14} />
                      {t('vendor.downloadCsv')}
                    </button>
                    <Button variant="secondary" className="flex-1" onClick={() => handleAdvance(order)}>
                      {order.status === 'pending'
                        ? t('vendor.markShipped')
                        : order.status === 'shipped'
                          ? t('vendor.markFulfilled')
                          : t('vendor.resetToPending')}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
