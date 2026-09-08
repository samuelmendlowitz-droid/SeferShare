import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CornerButton } from './CornerButton';
import { FloatingToggleBar, type ToggleOption } from './FloatingToggleBar';
import { TopSearchBar } from './TopSearchBar';
import { HomeIcon, PlusIcon, ProfileIcon } from '../ui/icons';

export type HomeFilter = 'all' | 'where' | 'who' | 'what';
export type ProfileTab = 'campaigns' | 'donations' | 'notifications' | 'settings';

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

type AppLayoutProps = HomeLayoutProps | ProfileLayoutProps;

export function AppLayout(props: AppLayoutProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

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

  const isHome = props.variant === 'home';

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
            <CornerButton
              label={isHome ? t('nav.profile') : t('nav.home')}
              icon={isHome ? <ProfileIcon /> : <HomeIcon />}
              onClick={() => navigate(isHome ? '/profile' : '/')}
            />
            <CornerButton
              label={isHome ? t('donation.browse') : t('campaign.create')}
              icon={<PlusIcon />}
              onClick={() => navigate(isHome ? '/donate' : '/campaigns/new')}
            />
          </div>

          {isHome ? (
            <FloatingToggleBar
              options={homeOptions}
              activeKey={props.filter}
              onChange={(key) => props.onFilterChange(key as HomeFilter)}
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
