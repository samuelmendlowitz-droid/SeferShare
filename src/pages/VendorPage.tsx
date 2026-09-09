import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { AppLayout, type VendorTab } from '../components/layout/AppLayout';
import { CatalogTab } from '../components/vendor/CatalogTab';
import { VendorOrdersTab } from '../components/vendor/VendorOrdersTab';
import { SalesTab } from '../components/vendor/SalesTab';

export function VendorPage() {
  const { t } = useTranslation();
  const { profile, loading } = useAuth();
  const [tab, setTab] = useState<VendorTab>('catalog');
  const [searchQuery, setSearchQuery] = useState('');

  if (loading) return null;

  if (!profile?.isVendor || !profile.vendorApproved) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <p className="text-text-muted">Not authorized.</p>
      </div>
    );
  }

  return (
    <AppLayout variant="vendor" tab={tab} onTabChange={setTab} onSearch={setSearchQuery}>
      <h1 className="mb-4 text-xl font-bold">{t(`vendor.${tab}`)}</h1>

      {tab === 'catalog' && <CatalogTab />}
      {tab === 'orders' && <VendorOrdersTab />}
      {tab === 'sales' && <SalesTab />}
    </AppLayout>
  );
}
