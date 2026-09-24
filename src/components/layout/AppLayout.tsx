import { useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePushka } from '../../context/PushkaContext';
import { CornerButton } from './CornerButton';
import { FloatingToggleBar, type FilterSortButtonProps, type ToggleOption } from './FloatingToggleBar';
import { TopSearchBar } from './TopSearchBar';
import { CampaignIcon, HomeIcon, PlusIcon, ProfileIcon, PushkaIcon, BookIcon } from '../ui/icons';

export type ProfileTab = 'campaigns' | 'donations' | 'institution' | 'notifications' | 'stickers' | 'settings';
export type SeforimTab = 'gallery' | 'demand' | 'claim' | 'myGallery';

interface BaseLayoutProps {
  onSearch: (query: string) => void;
  filterSort?: FilterSortButtonProps;
  createAction?: { caption: string; onClick: () => void };
  /** Shows the cart/pushka button in the header — every browsing/shopping
   *  surface (Home, Campaigns, Seforim), not the account-management ones. */
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
  { variant: 'home', path: '/', icon: <HomeIcon width={18} height={18} />, labelKey: 'nav.home' },
  { variant: 'campaigns', path: '/campaigns', icon: <CampaignIcon width={18} height={18} />, labelKey: 'nav.campaigns' },
  { variant: 'seforim', path: '/seforim', icon: <BookIcon width={18} height={18} />, labelKey: 'nav.seforim' },
  { variant: 'profile', path: '/profile', icon: <ProfileIcon width={18} height={18} />, labelKey: 'nav.profile' },
];

// Shared with TopSearchBar, which needs to sit in the exact same spot as the
// floating sub-nav row it replaces while searching (see the `top` comment there).
const HEADER_ROW_HEIGHT_PX = 56;
const TOP_GAP_PX = 12;
const SUBNAV_HEIGHT_PX = 48;

const HEADER_BUTTON_CLASS =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-btn transition-colors duration-200';

/** Shared chrome for every top-level page: a fixed header (logo, the 4-item
 *  main destination nav, the cart button) and — only on pages with something
 *  to search/filter/switch between — a floating sub-nav row just below it
 *  (search, sub-tabs, filter). One design language, one bar each, instead of
 *  two similar-looking stacked bars. */
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
  // campaign — so it skips the floating sub-nav row entirely.
  const showSubnav = props.variant !== 'home';
  const subnavTop = `calc(env(safe-area-inset-top) + ${HEADER_ROW_HEIGHT_PX + TOP_GAP_PX}px)`;
  const mainPaddingTop = showSubnav
    ? `calc(env(safe-area-inset-top) + ${HEADER_ROW_HEIGHT_PX + TOP_GAP_PX + SUBNAV_HEIGHT_PX + TOP_GAP_PX}px)`
    : `calc(env(safe-area-inset-top) + ${HEADER_ROW_HEIGHT_PX + TOP_GAP_PX}px)`;

  return (
    <div className="min-h-dvh pb-24">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-md">
        <div
          className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-2 px-4"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <button type="button" onClick={() => navigate('/')} className="shrink-0 text-base font-bold text-text">
            {t('app.name')}
          </button>

          <nav className="flex items-center gap-1 rounded-pill bg-bg p-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.variant}
                type="button"
                onClick={() => item.path !== location.pathname && navigate(item.path)}
                aria-label={t(item.labelKey)}
                aria-current={props.variant === item.variant ? 'page' : undefined}
                className={`flex h-8 w-8 items-center justify-center rounded-pill transition-colors duration-200 ${
                  props.variant === item.variant ? 'bg-accent text-white' : 'text-text-muted hover:text-accent'
                }`}
              >
                {item.icon}
              </button>
            ))}
          </nav>

          {props.showPushka ? (
            <button
              type="button"
              onClick={() => navigate('/pushka')}
              aria-label={t('pushka.title')}
              className={`${HEADER_BUTTON_CLASS} relative text-accent hover:bg-bg`}
            >
              <PushkaIcon width={20} height={20} />
              {Boolean(pushka.totalCount) && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
                  {pushka.totalCount}
                </span>
              )}
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-4" style={{ paddingTop: mainPaddingTop }}>
        {props.children}
      </main>

      {searchOpen ? (
        <TopSearchBar query={query} onQueryChange={handleQueryChange} onClose={closeSearch} />
      ) : (
        showSubnav && (
          <div className="fixed inset-x-0 z-40 mx-auto max-w-2xl px-4" style={{ top: subnavTop }}>
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
        )
      )}

      {props.createAction && (
        <div
          className="fixed z-40 end-4"
          style={{ bottom: 'max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))' }}
        >
          <CornerButton
            label={props.createAction.caption}
            caption={props.createAction.caption}
            icon={<PlusIcon width={16} height={16} />}
            onClick={props.createAction.onClick}
          />
        </div>
      )}
    </div>
  );
}
