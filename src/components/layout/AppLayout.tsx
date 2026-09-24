import { useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePushka } from '../../context/PushkaContext';
import { CornerButton } from './CornerButton';
import { FloatingToggleBar, type FilterSortButtonProps, type ToggleOption } from './FloatingToggleBar';
import { PageHeading } from './PageHeading';
import { TopSearchBar } from './TopSearchBar';
import { CampaignIcon, HomeIcon, PlusIcon, ProfileIcon, PushkaIcon, BookIcon } from '../ui/icons';

export type ProfileTab = 'campaigns' | 'donations' | 'institution' | 'notifications' | 'stickers' | 'settings';
export type SeforimTab = 'gallery' | 'demand' | 'claim' | 'myGallery';

interface BaseLayoutProps {
  onSearch: (query: string) => void;
  filterSort?: FilterSortButtonProps;
  createAction?: { caption: string; onClick: () => void };
  /** Shows the cart/pushka corner button — every browsing/shopping surface
   *  (Home, Campaigns, Seforim), not the account-management ones. */
  showPushka?: boolean;
  children: ReactNode;
}

interface HomeLayoutProps extends BaseLayoutProps {
  variant: 'home';
}

interface CampaignsLayoutProps extends BaseLayoutProps {
  variant: 'campaigns';
}

interface SeforimLayoutProps extends BaseLayoutProps {
  variant: 'seforim';
  tab: SeforimTab;
  onTabChange: (tab: SeforimTab) => void;
}

interface ProfileLayoutProps extends BaseLayoutProps {
  variant: 'profile';
  tab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

type AppLayoutProps = HomeLayoutProps | CampaignsLayoutProps | SeforimLayoutProps | ProfileLayoutProps;

const NAV_ITEMS: { variant: AppLayoutProps['variant']; path: string; icon: ReactNode; labelKey: string }[] = [
  { variant: 'home', path: '/', icon: <HomeIcon />, labelKey: 'nav.home' },
  { variant: 'campaigns', path: '/campaigns', icon: <CampaignIcon />, labelKey: 'nav.campaigns' },
  { variant: 'seforim', path: '/seforim', icon: <BookIcon />, labelKey: 'nav.seforim' },
  { variant: 'profile', path: '/profile', icon: <ProfileIcon />, labelKey: 'nav.profile' },
];

/** Shared chrome for every top-level page: a frozen page heading, the fixed
 *  bottom cluster (search/sub-tabs/filter row above a 4-item main destination
 *  row — Home / Campaigns / Seforim / Profile, always all four, current one
 *  highlighted), and the bottom fade that keeps scrolled content from butting
 *  up against those fixed buttons. */
export function AppLayout(props: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const pushka = usePushka();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const seforimOptions: ToggleOption[] =
    props.variant === 'seforim'
      ? [
          { key: 'gallery', label: t('nav.gallery') },
          { key: 'demand', label: t('nav.demand') },
          { key: 'claim', label: t('nav.availableToClaim') },
          { key: 'myGallery', label: t('nav.myGallery') },
        ]
      : [];

  const profileOptions: ToggleOption[] =
    props.variant === 'profile'
      ? [
          { key: 'campaigns', label: t('nav.myCampaigns') },
          { key: 'donations', label: t('nav.donations') },
          { key: 'institution', label: t('nav.myInstitution') },
          { key: 'notifications', label: t('nav.notifications') },
          { key: 'stickers', label: t('nav.stickers') },
          { key: 'settings', label: t('nav.settings') },
        ]
      : [];

  const actionButton = props.createAction ? (
    <CornerButton
      label={props.createAction.caption}
      caption={props.createAction.caption}
      icon={<PlusIcon width={16} height={16} />}
      onClick={props.createAction.onClick}
    />
  ) : null;

  const pushkaButton = props.showPushka ? (
    <CornerButton
      label={t('pushka.title')}
      icon={<PushkaIcon />}
      badge={pushka.totalCount}
      onClick={() => navigate('/pushka')}
    />
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

  // Home has nothing to search or filter — a static intro/guide + featured
  // campaign — so it skips this row entirely rather than showing an empty bar.
  const showToggleRow = props.variant !== 'home';

  return (
    <div className="min-h-dvh pb-40">
      {/* Extra top clearance while searching so content doesn't render under the
          fixed top search bar. */}
      <main className={`mx-auto max-w-2xl px-4 ${searchOpen ? 'pt-20' : 'pt-6'}`}>
        <PageHeading page={t(`nav.${props.variant}`)} className="mb-4 text-xl font-bold" />
        {props.children}
      </main>

      {searchOpen ? (
        <TopSearchBar query={query} onQueryChange={handleQueryChange} onClose={closeSearch} />
      ) : (
        <>
          {/* Fades scrolled-past content out before it reaches the fixed buttons,
              instead of it being cut off hard underneath them — spans roughly the
              same height as the bottom cluster's own reserved space (pb-40 above),
              from fully opaque at the screen edge up to transparent above it. */}
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-40 bg-gradient-to-t from-bg via-bg/70 to-transparent" />

          {/* Fixed bottom cluster: same outer margin (px-4, plus the safe-area inset
              on notched/home-indicator devices) as `main`, and the same gap (gap-3)
              between its rows. Hidden entirely while searching so the keyboard/search
              bar have the full screen. */}
          <div
            className="fixed inset-x-0 z-40 mx-auto flex max-w-2xl flex-col gap-3 px-4"
            style={{ bottom: 'max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))' }}
          >
            {showToggleRow && (
              <div className="flex items-center justify-between gap-2">
                {props.variant === 'seforim' ? (
                  <FloatingToggleBar
                    options={seforimOptions}
                    activeKey={props.tab}
                    onChange={(key) => props.onTabChange(key as SeforimTab)}
                    onOpenSearch={() => setSearchOpen(true)}
                    filterSort={props.filterSort}
                  />
                ) : props.variant === 'profile' ? (
                  <FloatingToggleBar
                    options={profileOptions}
                    activeKey={props.tab}
                    onChange={(key) => props.onTabChange(key as ProfileTab)}
                    onOpenSearch={() => setSearchOpen(true)}
                    filterSort={props.filterSort}
                  />
                ) : (
                  <FloatingToggleBar
                    options={[]}
                    activeKey=""
                    onChange={() => {}}
                    onOpenSearch={() => setSearchOpen(true)}
                    filterSort={props.filterSort}
                  />
                )}
              </div>
            )}

            {(actionButton || pushkaButton) && (
              <div className="flex items-center justify-end gap-2">
                {actionButton}
                {pushkaButton}
              </div>
            )}

            <div className="flex items-center justify-between gap-1 rounded-pill border border-[rgba(214,228,240,0.6)] bg-[rgba(255,255,255,0.72)] px-1.5 py-1.5 shadow-navbar backdrop-blur-md">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.variant}
                  type="button"
                  onClick={() => item.path !== location.pathname && navigate(item.path)}
                  aria-label={t(item.labelKey)}
                  aria-current={props.variant === item.variant ? 'page' : undefined}
                  className={`flex h-11 flex-1 items-center justify-center rounded-pill transition-colors duration-200 ${
                    props.variant === item.variant ? 'bg-accent text-white' : 'text-text-muted hover:bg-white/60 hover:text-accent'
                  }`}
                >
                  {item.icon}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
