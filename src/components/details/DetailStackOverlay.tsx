import { useDetailStack, type DetailStackEntry } from '../../context/DetailStackContext';
import { CampaignPopupContent } from './CampaignPopupContent';
import { InstitutionPopupContent } from './InstitutionPopupContent';
import { NeshamaPopupContent } from './NeshamaPopupContent';
import { SeferPopupContent } from './SeferPopupContent';

const BASE_Z_INDEX = 50;

/** Renders the current detail popup stack (see DetailStackContext) — mounted
 *  once near the app root, overlaying whatever page is underneath regardless
 *  of route. */
export function DetailStackOverlay() {
  const { stack, closeTop } = useDetailStack();

  return (
    <>
      {stack.map((entry, idx) => (
        <PopupForEntry
          key={`${entry.type}:${entry.id}:${idx}`}
          entry={entry}
          isTop={idx === stack.length - 1}
          zIndex={BASE_Z_INDEX + idx}
          onClose={closeTop}
        />
      ))}
    </>
  );
}

interface PopupForEntryProps {
  entry: DetailStackEntry;
  isTop: boolean;
  zIndex: number;
  onClose: () => void;
}

function PopupForEntry({ entry, isTop, zIndex, onClose }: PopupForEntryProps) {
  switch (entry.type) {
    case 'campaign':
      return <CampaignPopupContent id={entry.id} isTop={isTop} zIndex={zIndex} onClose={onClose} />;
    case 'institution':
      return <InstitutionPopupContent id={entry.id} isTop={isTop} zIndex={zIndex} onClose={onClose} />;
    case 'neshama':
      return <NeshamaPopupContent id={entry.id} isTop={isTop} zIndex={zIndex} onClose={onClose} />;
    case 'sefer':
      return <SeferPopupContent id={entry.id} isTop={isTop} zIndex={zIndex} onClose={onClose} />;
    default:
      return null;
  }
}
