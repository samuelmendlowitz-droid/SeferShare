import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon } from './icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Centered popup dialog — for a short add-new form, distinct from the bottom FilterSortSheet. */
export function Modal({ open, onClose, title, children }: ModalProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4">
      <div className="fixed inset-0 -z-10 bg-text/40" onClick={onClose} />
      <div className="relative mx-auto my-8 w-full max-w-md rounded-card bg-surface shadow-navbar">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-card bg-surface p-4 pb-3">
          <h2 className="text-base font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('actions.cancel')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-bg"
          >
            <CloseIcon width={16} height={16} />
          </button>
        </div>
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}
