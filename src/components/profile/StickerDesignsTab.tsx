import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useStickerDesigns } from '../../hooks/useStickerDesigns';
import { DEFAULT_STICKER_DESIGN, normalizeStickerDesign } from '../../lib/stickerDesign';
import type { StickerDesign } from '../../types';
import type { StickerContent } from '../donation/StickerPreview';
import { StickerDesignEditor } from '../donation/StickerDesignEditor';

// Matches AppLayout's own reserved space for its fixed bottom nav cluster
// (the outer page wrapper's `pb-36`) — not a guess, the exact same constant.
const BOTTOM_NAV_RESERVE_PX = 144;

/** Standalone home for the same sticker-design library the cart's "Customize"
 *  button opens (see StickerDesignEditor) — lets a donor build and manage
 *  designs outside of an active checkout, previewed with placeholder text
 *  since there's no real dedication/campaign to show here. */
export function StickerDesignsTab() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const stickerDesignsData = useStickerDesigns(profile?.uid);

  const [design, setDesign] = useState<StickerDesign>(DEFAULT_STICKER_DESIGN);
  const [seeded, setSeeded] = useState(false);

  // Measured (not guessed) so the panel reaches exactly to the bottom nav
  // regardless of font metrics/RTL heading width/device chrome — a fixed
  // `calc(100dvh - Npx)` can't know how tall the page heading above it
  // actually rendered, and a mismatch there either strands blank space or
  // clips the last row of options.
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  useLayoutEffect(() => {
    function measure() {
      if (!containerRef.current) return;
      const top = containerRef.current.getBoundingClientRect().top;
      setHeight(Math.max(320, window.innerHeight - top - BOTTOM_NAV_RESERVE_PX));
    }
    measure();
    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener('resize', measure);
    window.addEventListener('resize', measure);
    return () => {
      visualViewport?.removeEventListener('resize', measure);
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    if (seeded || stickerDesignsData.loading) return;
    const mostRecent = stickerDesignsData.designs[0];
    if (mostRecent) setDesign(normalizeStickerDesign(mostRecent.design));
    setSeeded(true);
  }, [stickerDesignsData.loading, stickerDesignsData.designs, seeded]);

  const previewContent: StickerContent = {
    dedicationName: t('donation.algorithmChoice'),
    donorName: profile?.displayName,
  };

  return (
    // A bounded-height panel (not just a normal-flow block) so StickerDesignEditor's
    // own frozen-preview / scrollable-options split has a real height to fill.
    <div
      ref={containerRef}
      style={{ height }}
      className="overflow-hidden rounded-card border border-border bg-surface shadow-card"
    >
      <StickerDesignEditor
        value={design}
        onChange={setDesign}
        content={previewContent}
        savedDesigns={stickerDesignsData.designs}
        onCreate={stickerDesignsData.create}
        onUpdateContent={stickerDesignsData.updateContent}
        onRename={stickerDesignsData.rename}
        onDelete={stickerDesignsData.remove}
      />
    </div>
  );
}
