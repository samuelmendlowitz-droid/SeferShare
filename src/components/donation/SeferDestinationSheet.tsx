import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listInstitutionsNeedingSefer } from '../../services/campaigns';
import type { Institution } from '../../types';
import { BubbleGrid } from '../ui/BubbleGrid';
import { CloseIcon } from '../ui/icons';

const LET_INSTITUTION_CLAIM = 'claim';
const CHOOSE_FOR_ME = 'algorithm';

export interface SeferDestination {
  institutionId?: string;
  availableForClaim?: boolean;
}

interface SeferDestinationSheetProps {
  open: boolean;
  seferId: string;
  onClose: () => void;
  onSelect: (destination: SeferDestination) => void;
}

/** Bottom sheet for choosing where an untagged cart item should go — opened by
 *  tapping its "No mokom selected" row. Options: let any institution claim it
 *  for free (donated with no destination, see availableStock.ts), leave it for
 *  the algorithm to assign at checkout, or pick a specific institution that
 *  currently needs this sefer. */
export function SeferDestinationSheet({ open, seferId, onClose, onSelect }: SeferDestinationSheetProps) {
  const { t } = useTranslation();
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setInstitutions([]);
    listInstitutionsNeedingSefer(seferId).then((found) => {
      if (!cancelled) setInstitutions(found);
    });
    return () => {
      cancelled = true;
    };
  }, [open, seferId]);

  if (!open) return null;

  function choose(value: string) {
    if (value === LET_INSTITUTION_CLAIM) onSelect({ availableForClaim: true });
    else if (value === CHOOSE_FOR_ME) onSelect({});
    else onSelect({ institutionId: value });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-text/40" onClick={onClose} />
      <div className="relative max-h-[80vh] overflow-y-auto rounded-t-card bg-surface p-4 shadow-navbar">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">{t('pushka.chooseDestinationTitle')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('actions.cancel') ?? ''}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-bg"
          >
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        <BubbleGrid
          rows={3}
          options={[
            { value: LET_INSTITUTION_CLAIM, label: t('pushka.letInstitutionClaim') },
            { value: CHOOSE_FOR_ME, label: t('pushka.pickForMe') },
            ...institutions.map((inst) => ({ value: inst.institutionId, label: inst.name })),
          ]}
          isSelected={() => false}
          onToggle={choose}
        />
      </div>
    </div>
  );
}
