import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout, type ProfileTab } from '../components/layout/AppLayout';
import { MyCampaignsTab } from '../components/profile/MyCampaignsTab';
import { DonationsTab } from '../components/profile/DonationsTab';
import { NotificationsTab } from '../components/profile/NotificationsTab';
import { SettingsTab } from '../components/profile/SettingsTab';
import { CatalogTab } from '../components/profile/CatalogTab';

export function ProfilePage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<ProfileTab>('campaigns');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AppLayout variant="profile" tab={tab} onTabChange={setTab} onSearch={setSearchQuery}>
      <h1 className="mb-4 text-xl font-bold">{t(`nav.${tab === 'campaigns' ? 'myCampaigns' : tab}`)}</h1>

      {tab === 'campaigns' && <MyCampaignsTab />}
      {tab === 'donations' && <DonationsTab />}
      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'catalog' && <CatalogTab />}
      {tab === 'settings' && <SettingsTab />}

      {searchQuery && tab === 'campaigns' && (
        <p className="mt-2 text-xs text-text-muted">Filtering by "{searchQuery}"…</p>
      )}
    </AppLayout>
  );
}
