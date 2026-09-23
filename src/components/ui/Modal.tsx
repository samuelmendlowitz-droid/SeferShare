import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon } from './icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Skips the default padded/scrolling body wrapper, handing the full body
   *  area to `children` unstyled — for content (like StickerDesignEditor)
   *  that manages its own internal frozen-section/scroll-section split. */
  fillBody?: boolean;
}

/**
 * Full-screen add/edit form — same visual shell as DetailPopup (the info-card
 * popups): a thin margin, frozen header bar with title + close, and a
 * scrollable body. It's a stylistic full page rather than a dismissable
 * overlay — there's no backdrop, and nothing behind it is visible.
 */
export function Modal({ open, onClose, title, children, fillBody }: ModalProps) {
  const { t } = useTranslation();

  // Freeze the page underneath, same as DetailStackOverlay does for the detail
  // popups — only this form's own body should scroll while it's open.
  useEffect(() => {
    if (!open) return;
    const { documentElement, body } = document;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    documentElement.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      documentElement.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-x-2 top-2 z-50 flex flex-col overflow-hidden rounded-card bg-surface shadow-navbar sm:inset-x-4 sm:top-4"
      // Bottom inset alone (unlike inset-2/sm:inset-4) also clears a device's
      // home-indicator/gesture-bar safe area, so the last bit of content never
      // sits underneath it or gets visually cut off there.
      style={{ bottom: 'max(0.5rem, calc(env(safe-area-inset-bottom) + 0.5rem))' }}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <h2 className="truncate pe-2 text-sm font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('actions.cancel')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-bg"
        >
          <CloseIcon width={16} height={16} />
        </button>
      </div>
      {fillBody ? (
        <div className="flex-1 overflow-hidden">{children}</div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
      )}
    </div>
  );
}
