import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { CornerButton } from './CornerButton';
import { FloatingToggleBar, type ToggleOption } from './FloatingToggleBar';
import { TopSearchBar } from './TopSearchBar';
import { GiftIcon, HomeIcon, PlusIcon, ProfileIcon, StoreIcon } from '../ui/icons';

export type HomeFilter = 'all' | 'where' | 'who' | 'what';
export type ProfileTab = 'campaigns' | 'donations' | 'notifications' | 'settings';
export type VendorTab = 'catalog' | 'orders' | 'sales';

interface HomeLayoutProps {
  variant: 'home';
  filter: HomeFilter;
  onFilterChange: (filter: HomeFilter) => void;
  onSearch: (query: string) => void;
  children: ReactNode;
}

interface ProfileLayoutProps {
  variant: 'profile';
  tab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  onSearch: (query: string) => void;
  children: ReactNode;
}

interface VendorLayoutProps {
  variant: 'vendor';
  tab: VendorTab;
  onTabChange: (tab: VendorTab) => void;
  onSearch: (query: string) => void;
  children: ReactNode;
}

type AppLayoutProps = HomeLayoutProps | ProfileLayoutProps | VendorLayoutProps;

export function AppLayout(props: AppLayoutProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const isVendor = Boolean(profile?.isVendor && profile.vendorApproved);

  const homeOptions: ToggleOption[] = useMemo(
    () => [
      { key: 'all', label: t('nav.allCampaigns') },
      { key: 'where', label: t('nav.where') },
      { key: 'who', label: t('nav.who') },
      { key: 'what', label: t('nav.what') },
    ],
    [t],
  );

  const profileOptions: ToggleOption[] = useMemo(
    () => [
      { key: 'campaigns', label: t('nav.myCampaigns') },
      { key: 'donations', label: t('nav.donations') },
      { key: 'notifications', label: t('nav.notifications') },
      { key: 'settings', label: t('nav.settings') },
    ],
    [t],
  );

  const vendorOptions: ToggleOption[] = useMemo(
    () => [
      { key: 'catalog', label: t('vendor.catalog') },
      { key: 'orders', label: t('vendor.orders') },
      { key: 'sales', label: t('vendor.sales') },
    ],
    [t],
  );

  // Every reachable page (vendor only for approved vendor accounts), so the bottom-left
  // cluster can always show "the other two" regardless of which page is active.
  const pages = useMemo(() => {
    const base: { key: 'home' | 'profile' | 'vendor'; label: string; icon: ReactNode; path: string }[] = [
      { key: 'home', label: t('nav.home'), icon: <HomeIcon />, path: '/' },
      { key: 'profile', label: t('nav.profile'), icon: <ProfileIcon />, path: '/profile' },
    ];
    if (isVendor) {
      base.push({ key: 'vendor', label: t('nav.vendor'), icon: <StoreIcon />, path: '/vendor' });
    }
    return base;
  }, [t, isVendor]);

  const otherPages = pages.filter((p) => p.key !== props.variant);

  const actionButton =
    props.variant === 'home' ? (
      <CornerButton label={t('donation.browse')} icon={<GiftIcon />} onClick={() => navigate('/donate')} />
    ) : props.variant === 'profile' ? (
      <CornerButton label={t('campaign.create')} icon={<PlusIcon />} onClick={() => navigate('/campaigns/new')} />
    ) : null;

  function handleQueryChange(next: string) {
    setQuery(next);
    props.onSearch(next);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery('');
    props.onSearch('');
  }

  return (
    <div className="min-h-dvh pb-36">
      {/* Extra top clearance while searching so content doesn't render under the
          fixed top search bar. */}
      <main className={`mx-auto max-w-2xl px-4 ${searchOpen ? 'pt-20' : 'pt-6'}`}>{props.children}</main>

      {searchOpen ? (
        <TopSearchBar query={query} onQueryChange={handleQueryChange} onClose={closeSearch} />
      ) : (
        // Fixed bottom cluster: same outer margin (px-4 / bottom-4, plus the safe-area
        // inset on notched/home-indicator devices) as `main`, and the same gap (gap-4)
        // between the button row and the nav bar below it. Hidden entirely while
        // searching so the keyboard/search bar have the full screen.
        <div
          className="fixed inset-x-0 z-40 mx-auto flex max-w-2xl flex-col gap-4 px-4"
          style={{ bottom: 'max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {otherPages.map((p) => (
                <CornerButton key={p.key} label={p.label} icon={p.icon} onClick={() => navigate(p.path)} />
              ))}
            </div>
            {actionButton}
          </div>

          {props.variant === 'home' ? (
            <FloatingToggleBar
              options={homeOptions}
              activeKey={props.filter}
              onChange={(key) => props.onFilterChange(key as HomeFilter)}
              onOpenSearch={() => setSearchOpen(true)}
            />
          ) : props.variant === 'vendor' ? (
            <FloatingToggleBar
              options={vendorOptions}
              activeKey={props.tab}
              onChange={(key) => props.onTabChange(key as VendorTab)}
              onOpenSearch={() => setSearchOpen(true)}
            />
          ) : (
            <FloatingToggleBar
              options={profileOptions}
              activeKey={props.tab}
              onChange={(key) => props.onTabChange(key as ProfileTab)}
              onOpenSearch={() => setSearchOpen(true)}
            />
          )}
        </div>
      )}
    </div>
  );
}
