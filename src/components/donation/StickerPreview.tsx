import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  findStickerLayout,
  stickerFontStack,
  STICKER_ASPECT_RATIO,
  type StickerDesign,
  type StickerElementKey,
} from '../../lib/stickerDesign';
import { LeafIcon, MenorahIcon, StarOfDavidIcon } from '../ui/icons';

export interface StickerContent {
  /** Campaign title, or the "your dedication" title — shown as a small label. */
  label?: string;
  dedicationName?: string;
  dedicationHebrewName?: string;
  message?: string;
  donorName?: string;
}

interface StickerPreviewProps {
  design: StickerDesign;
  content: StickerContent;
  className?: string;
}

function FlourishGlyph({ value, size }: { value: StickerDesign['flourish']; size: number }) {
  if (value === 'star') return <StarOfDavidIcon width={size} height={size} />;
  if (value === 'leaf') return <LeafIcon width={size} height={size} />;
  if (value === 'menorah') return <MenorahIcon width={size} height={size} />;
  return null;
}

function Divider({ design }: { design: StickerDesign }) {
  const { divider, colors } = design;
  if (divider === 'none') return null;
  if (divider === 'dots') {
    return (
      <p className="my-1.5 text-center text-xs tracking-widest" style={{ color: colors.divider }}>
        • • •
      </p>
    );
  }
  if (divider === 'starLine') {
    return (
      <div className="my-1.5 flex items-center gap-2" style={{ color: colors.divider }}>
        <span className="h-px flex-1" style={{ backgroundColor: colors.divider }} />
        <StarOfDavidIcon width={10} height={10} />
        <span className="h-px flex-1" style={{ backgroundColor: colors.divider }} />
      </div>
    );
  }
  return <hr className="my-1.5 border-t" style={{ borderColor: colors.divider }} />;
}

/** Renders the dedication sticker exactly as it will be printed on a sefer, at a
 *  standard book-cover proportion so it scales to fit whatever slot it's shown in
 *  (the cart editor's preview, a confirmation card, an admin/print view, etc). */
export function StickerPreview({ design, content, className = '' }: StickerPreviewProps) {
  const { t } = useTranslation();
  const layout = findStickerLayout(design.layout);
  const fontStack = stickerFontStack(design.font);
  const { colors } = design;

  const frameStyle: CSSProperties =
    design.frame === 'none'
      ? {}
      : design.frame === 'double'
        ? { borderStyle: 'double', borderWidth: 6, borderColor: colors.frame }
        : design.frame === 'ornate'
          ? { borderStyle: 'solid', borderWidth: 3, borderColor: colors.frame }
          : { borderStyle: 'solid', borderWidth: 1, borderColor: colors.frame };

  const elements: Partial<Record<StickerElementKey, ReactNode>> = {
    label: content.label ? (
      <p className="text-center text-[10px] font-semibold uppercase tracking-wide" style={{ color: colors.label }}>
        {content.label}
      </p>
    ) : null,
    dedication: content.dedicationName ? (
      <div className="text-center" style={{ color: colors.dedication, fontFamily: fontStack }}>
        <p className="text-sm font-semibold leading-snug">
          {t('neshama.liluyNishmat')} {content.dedicationName}
        </p>
        {content.dedicationHebrewName && (
          <p dir="rtl" className="mt-0.5 text-sm leading-snug">
            {content.dedicationHebrewName}
          </p>
        )}
      </div>
    ) : null,
    message: content.message ? (
      <p className="text-center text-xs italic leading-snug" style={{ color: colors.message }}>
        {content.message}
      </p>
    ) : null,
    donor: content.donorName ? (
      <p className="text-center text-xs" style={{ color: colors.donor }}>
        — {content.donorName}
      </p>
    ) : null,
  };

  const visibleKeys = layout.order.filter((key) => elements[key]);

  return (
    <div
      className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-sm p-4 ${className}`}
      style={{ aspectRatio: STICKER_ASPECT_RATIO, backgroundColor: colors.background, ...frameStyle }}
    >
      {design.frame === 'ornate' &&
        [
          { top: 3, left: 3 },
          { top: 3, right: 3 },
          { bottom: 3, left: 3 },
          { bottom: 3, right: 3 },
        ].map((pos, idx) => (
          <span
            key={idx}
            className="absolute h-1.5 w-1.5 rotate-45"
            style={{ ...pos, backgroundColor: colors.frame }}
          />
        ))}

      {design.flourish !== 'none' && (
        <div className="mb-2" style={{ color: colors.flourish }}>
          <FlourishGlyph value={design.flourish} size={20} />
        </div>
      )}

      <div className="flex w-full flex-col items-center justify-center gap-1">
        {visibleKeys.map((key, idx) => (
          <div key={key} className="w-full">
            {idx > 0 && <Divider design={design} />}
            {elements[key]}
          </div>
        ))}
        {visibleKeys.length === 0 && (
          <p className="text-center text-xs" style={{ color: colors.label }}>
            {t('neshama.liluyNishmat')}
          </p>
        )}
      </div>
    </div>
  );
}
