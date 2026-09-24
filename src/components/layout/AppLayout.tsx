import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppHeader, HEADER_TOTAL_HEIGHT_PX } from './AppHeader';
import { FloatingToggleBar, type FilterSortButtonProps, type ToggleOption } from './FloatingToggleBar';
import { TopSearchBar } from './TopSearchBar';
import { CornerButton } from './CornerButton';
import { PlusIcon } from '../ui/icons';

export type ProfileTab = 'campaigns' | 'donations' | 'institution' | 'notifications' | 'stickers' | 'settings';
export type SeforimTab = 'gallery' | 'demand' | 'claim' | 'myGallery';

interface BaseLayoutProps {
  onSearch: (query: string) => void;
  filterSort?: FilterSortButtonProps;
  createAction?: { caption: string; onClick: () => void };
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

// Shared with TopSearchBar, which needs to sit in the exact same spot as the
// floating sub-nav row it replaces while searching (see the `top` comment there).
const TOP_GAP_PX = 12;
const SUBNAV_HEIGHT_PX = 48;

/** Shared chrome for the 4 top-level tabbed pages: the persistent AppHeader,
 *  plus — only on pages with something to search/filter/switch between — a
 *  floating sub-nav row just below it (search, sub-tabs, filter). Detail and
 *  editor pages use DetailPageLayout instead (header + back button, no
 *  floating sub-nav at all). */
export function AppLayout(props: AppLayoutProps) {
  const { t } = useTranslation();
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
  const subnavTop = `calc(env(safe-area-inset-top) + ${HEADER_TOTAL_HEIGHT_PX + TOP_GAP_PX}px)`;
  const mainPaddingTop = showSubnav
    ? `calc(env(safe-area-inset-top) + ${HEADER_TOTAL_HEIGHT_PX + TOP_GAP_PX + SUBNAV_HEIGHT_PX + TOP_GAP_PX}px)`
    : `calc(env(safe-area-inset-top) + ${HEADER_TOTAL_HEIGHT_PX + TOP_GAP_PX}px)`;

  return (
    <div className="min-h-dvh pb-24">
      <AppHeader />

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
