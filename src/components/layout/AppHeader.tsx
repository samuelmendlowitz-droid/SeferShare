import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePushka } from '../../context/PushkaContext';
import { CampaignIcon, HomeIcon, ProfileIcon, PushkaIcon, BookIcon } from '../ui/icons';

export const HEADER_TOP_ROW_HEIGHT_PX = 36;
export const HEADER_NAV_ROW_HEIGHT_PX = 56;
export const HEADER_TOTAL_HEIGHT_PX = HEADER_TOP_ROW_HEIGHT_PX + HEADER_NAV_ROW_HEIGHT_PX;

interface NavItem {
  path: string;
  icon: ReactNode;
  labelKey: string;
  /** Home and Pushka only match their own exact path; every other item also
   *  highlights on any nested route under it (e.g. a campaign detail page
   *  still shows "Campaigns" as the current section). */
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', icon: <HomeIcon width={18} height={18} />, labelKey: 'nav.home', exact: true },
  { path: '/campaigns', icon: <CampaignIcon width={18} height={18} />, labelKey: 'nav.campaigns' },
  { path: '/seforim', icon: <BookIcon width={18} height={18} />, labelKey: 'nav.seforim' },
  { path: '/profile', icon: <ProfileIcon width={18} height={18} />, labelKey: 'nav.profile' },
  { path: '/pushka', icon: <PushkaIcon width={18} height={18} />, labelKey: 'pushka.title', exact: true },
];

/** The app's persistent top chrome, shown on every page: the app name on its
 *  own short top row, and a full-width nav row underneath with the cart as
 *  one of its 5 items (icon + label each) rather than a separate button. */
export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const pushka = usePushka();

  function isActive(item: NavItem): boolean {
    if (item.exact) return location.pathname === item.path;
    return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto max-w-2xl px-4" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-center" style={{ height: HEADER_TOP_ROW_HEIGHT_PX }}>
          <button type="button" onClick={() => navigate('/')} className="text-base font-bold text-text">
            {t('app.name')}
          </button>
        </div>

        <nav className="flex items-stretch border-t border-border" style={{ height: HEADER_NAV_ROW_HEIGHT_PX }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const isPushka = item.path === '/pushka';
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => item.path !== location.pathname && navigate(item.path)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors duration-200 ${
                  active ? 'text-accent' : 'text-text-muted hover:text-accent'
                }`}
              >
                <span className="relative">
                  {item.icon}
                  {isPushka && Boolean(pushka.totalCount) && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
                      {pushka.totalCount}
                    </span>
                  )}
                </span>
                <span className={`text-[11px] leading-none ${active ? 'font-semibold' : 'font-medium'}`}>
                  {t(item.labelKey)}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
