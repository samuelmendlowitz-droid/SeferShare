import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useStickerDesigns } from '../../hooks/useStickerDesigns';
import { DEFAULT_STICKER_DESIGN, normalizeStickerDesign } from '../../lib/stickerDesign';
import type { StickerDesign } from '../../types';
import type { StickerContent } from '../donation/StickerPreview';
import { StickerDesignEditor } from '../donation/StickerDesignEditor';

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
  );
}
