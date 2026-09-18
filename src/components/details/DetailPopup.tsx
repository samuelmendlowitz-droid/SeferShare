import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon } from '../ui/icons';

interface DetailPopupProps {
  /** Shown in the frozen header bar — the campaign/mokom/neshama/sefer's name,
   *  or a loading placeholder while it's still being fetched. */
  title: string;
  onClose: () => void;
  /** False for a popup frozen behind another one — it stays mounted (so its
   *  scroll position/local state survive) but can't be interacted with. */
  isTop: boolean;
  zIndex: number;
  children: ReactNode;
  /** Rendered below the scrollable body, outside it — for a floating action bar
   *  that should stay pinned to the bottom of the popup rather than scroll
   *  with (or get clipped by) the content. */
  footer?: ReactNode;
}

/** Full-screen popup shell shared by all four detail overlays (see
 *  src/context/DetailStackContext.tsx) — occupies the whole screen with a thin
 *  margin, with a frozen header bar (name + close) and a scrollable body.
 *  Distinct from src/components/ui/Modal.tsx, which stays a small centered
 *  dialog for quick add/edit forms unrelated to this. */
export function DetailPopup({ title, onClose, isTop, zIndex, children, footer }: DetailPopupProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`fixed inset-2 flex flex-col overflow-hidden rounded-card bg-surface shadow-navbar sm:inset-4 ${
        isTop ? '' : 'pointer-events-none'
      }`}
      style={{ zIndex }}
      aria-hidden={!isTop}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <h1 className="truncate pe-2 text-base font-bold">{title}</h1>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('actions.cancel') ?? ''}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-bg"
        >
          <CloseIcon width={16} height={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
      {footer && <div className="shrink-0 border-t border-border px-4 py-3">{footer}</div>}
    </div>
  );
}
