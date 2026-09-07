import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { approveVendor, listPendingVendorApplications } from '../services/users';
import { listSefarim } from '../services/sefarim';
import { listNeshamos } from '../services/neshamos';
import {
  listAllCampaignsAdmin,
  listAllDonationsAdmin,
  listAllOrdersAdmin,
  mergeNeshamos,
  mergeSefarim,
  updateOrderStatus,
} from '../services/admin';
import type { Campaign, Donation, Neshama, Order, OrderStatus, Sefer, User } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

type Section = 'vendors' | 'sefarim' | 'neshamos' | 'campaigns' | 'donations' | 'orders';

const ORDER_STATUSES: OrderStatus[] = ['pending', 'shipped', 'delivered'];

export function AdminPage() {
  const { t } = useTranslation();
  const { profile, loading } = useAuth();
  const [section, setSection] = useState<Section>('vendors');

  const [pendingVendors, setPendingVendors] = useState<User[]>([]);
  const [sefarim, setSefarim] = useState<Sefer[]>([]);
  const [neshamos, setNeshamos] = useState<Neshama[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedSefarim, setSelectedSefarim] = useState<string[]>([]);
  const [selectedNeshamos, setSelectedNeshamos] = useState<string[]>([]);

  async function reload() {
    const [vendors, sef, nesh, camp, don, ord] = await Promise.all([
      listPendingVendorApplications(),
      listSefarim(),
      listNeshamos(),
      listAllCampaignsAdmin(),
      listAllDonationsAdmin(),
      listAllOrdersAdmin(),
    ]);
    setPendingVendors(vendors);
    setSefarim(sef);
    setNeshamos(nesh);
    setCampaigns(camp);
    setDonations(don);
    setOrders(ord);
  }

  useEffect(() => {
    if (profile?.isAdmin) reload();
  }, [profile]);

  if (loading) return <div className="mx-auto max-w-2xl px-4 pt-6 text-text-muted">…</div>;
  if (!profile?.isAdmin) {
    return <div className="mx-auto max-w-2xl px-4 pt-6 text-text-muted">Not authorized.</div>;
  }

  const sections: Section[] = ['vendors', 'sefarim', 'neshamos', 'campaigns', 'donations', 'orders'];

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <h1 className="mb-4 text-xl font-bold">{t('admin.title')}</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {sections.map((s) => (
          <Button key={s} variant={section === s ? 'primary' : 'secondary'} onClick={() => setSection(s)}>
            {s}
          </Button>
        ))}
      </div>

      {section === 'vendors' && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">{t('admin.vendorApplications')}</h2>
          {pendingVendors.length === 0 && <p className="text-text-muted">—</p>}
          {pendingVendors.map((v) => (
            <Card key={v.uid} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{v.displayName}</p>
                <p className="text-xs text-text-muted">{v.email}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    await approveVendor({ uid: v.uid, approve: true });
                    reload();
                  }}
                >
                  {t('admin.approve')}
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    await approveVendor({ uid: v.uid, approve: false });
                    reload();
                  }}
                >
                  {t('admin.reject')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {section === 'sefarim' && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">{t('admin.mergeSeforim')}</h2>
          <p className="text-xs text-text-muted">Select exactly two to merge (the first stays canonical).</p>
          {sefarim.map((s) => (
            <label key={s.seferId} className="flex items-center gap-2 rounded-btn border border-border p-2 text-sm">
              <input
                type="checkbox"
                checked={selectedSefarim.includes(s.seferId)}
                onChange={(e) =>
                  setSelectedSefarim((prev) =>
                    e.target.checked ? [...prev, s.seferId] : prev.filter((id) => id !== s.seferId),
                  )
                }
              />
              {s.englishName} · {s.hebrewName} ({t(`sefer.${s.type}`)})
            </label>
          ))}
          <Button
            disabled={selectedSefarim.length !== 2}
            onClick={async () => {
              await mergeSefarim(selectedSefarim[0], selectedSefarim[1]);
              setSelectedSefarim([]);
              reload();
            }}
          >
            Merge
          </Button>
        </div>
      )}

      {section === 'neshamos' && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">{t('admin.neshamaDedup')}</h2>
          <p className="text-xs text-text-muted">Select exactly two to merge (the first stays canonical).</p>
          {neshamos.map((n) => (
            <label key={n.neshamaId} className="flex items-center gap-2 rounded-btn border border-border p-2 text-sm">
              <input
                type="checkbox"
                checked={selectedNeshamos.includes(n.neshamaId)}
                onChange={(e) =>
                  setSelectedNeshamos((prev) =>
                    e.target.checked ? [...prev, n.neshamaId] : prev.filter((id) => id !== n.neshamaId),
                  )
                }
              />
              {n.name} {n.hebrewName ? `· ${n.hebrewName}` : ''} ({n.campaignCount} campaigns)
            </label>
          ))}
          <Button
            disabled={selectedNeshamos.length !== 2}
            onClick={async () => {
              await mergeNeshamos(selectedNeshamos[0], selectedNeshamos[1]);
              setSelectedNeshamos([]);
              reload();
            }}
          >
            Merge
          </Button>
        </div>
      )}

      {section === 'campaigns' && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">{t('admin.campaigns')}</h2>
          {campaigns.map((c) => (
            <Card key={c.campaignId}>
              <p className="text-sm font-semibold">{c.title ?? c.campaignId}</p>
              <p className="text-xs text-text-muted">
                {c.status} · {c.totalItemsFulfilled}/{c.totalItemsNeeded}
              </p>
            </Card>
          ))}
        </div>
      )}

      {section === 'donations' && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">{t('admin.donations')}</h2>
          {donations.map((d) => (
            <Card key={d.donationId}>
              <p className="text-sm font-semibold">${d.totalCharged.toFixed(2)}</p>
              <p className="text-xs text-text-muted">{d.status}</p>
            </Card>
          ))}
        </div>
      )}

      {section === 'orders' && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">{t('admin.orders')}</h2>
          {orders.map((o) => (
            <Card key={o.orderId} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{o.orderId}</p>
                <p className="text-xs text-text-muted">{o.vendorId}</p>
              </div>
              <select
                value={o.status}
                onChange={async (e) => {
                  await updateOrderStatus(o.orderId, e.target.value as OrderStatus);
                  reload();
                }}
                className="rounded-btn border border-border px-2 py-1 text-sm"
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
