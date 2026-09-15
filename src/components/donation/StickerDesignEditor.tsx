import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  STICKER_DIVIDERS,
  STICKER_FLOURISHES,
  STICKER_FONTS,
  STICKER_FRAMES,
  STICKER_LAYOUTS,
  type StickerColorSet,
  type StickerDesign,
} from '../../lib/stickerDesign';
import { StickerPreview, type StickerContent } from './StickerPreview';
import { FIELD_LABEL_CLASS } from '../ui/TextField';
import { Button } from '../ui/Button';

interface StickerDesignEditorProps {
  value: StickerDesign;
  onChange: (design: StickerDesign) => void;
  content: StickerContent;
  onSaveDefault?: () => Promise<void> | void;
}

const CHIP_CLASS = (selected: boolean) =>
  `rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
    selected
      ? 'border-accent bg-accent text-white'
      : 'border-border bg-surface text-text-muted hover:border-accent hover:text-accent'
  }`;

const COLOR_KEYS: (keyof StickerColorSet)[] = [
  'background',
  'frame',
  'divider',
  'flourish',
  'label',
  'dedication',
  'message',
  'donor',
];

export function StickerDesignEditor({ value, onChange, content, onSaveDefault }: StickerDesignEditorProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function setColor(key: keyof StickerColorSet, color: string) {
    onChange({ ...value, colors: { ...value.colors, [key]: color } });
  }

  async function handleSaveDefault() {
    if (!onSaveDefault) return;
    setSaving(true);
    try {
      await onSaveDefault();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <StickerPreview design={value} content={content} className="mx-auto max-w-[220px] shadow-card" />

      <div>
        <p className={FIELD_LABEL_CLASS}>{t('sticker.layoutLabel')}</p>
        <div className="flex flex-wrap gap-2">
          {STICKER_LAYOUTS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...value, layout: opt.value })}
              className={CHIP_CLASS(value.layout === opt.value)}
            >
              {opt.en} · {opt.he}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={FIELD_LABEL_CLASS}>{t('sticker.frameLabel')}</p>
        <div className="flex flex-wrap gap-2">
          {STICKER_FRAMES.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...value, frame: opt.value })}
              className={CHIP_CLASS(value.frame === opt.value)}
            >
              {opt.en} · {opt.he}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={FIELD_LABEL_CLASS}>{t('sticker.dividerLabel')}</p>
        <div className="flex flex-wrap gap-2">
          {STICKER_DIVIDERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...value, divider: opt.value })}
              className={CHIP_CLASS(value.divider === opt.value)}
            >
              {opt.en} · {opt.he}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={FIELD_LABEL_CLASS}>{t('sticker.flourishLabel')}</p>
        <div className="flex flex-wrap gap-2">
          {STICKER_FLOURISHES.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...value, flourish: opt.value })}
              className={CHIP_CLASS(value.flourish === opt.value)}
            >
              {opt.en} · {opt.he}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={FIELD_LABEL_CLASS}>{t('sticker.fontLabel')}</p>
        <div className="flex flex-wrap gap-2">
          {STICKER_FONTS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...value, font: opt.value })}
              className={CHIP_CLASS(value.font === opt.value)}
            >
              {opt.en} · {opt.he}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={FIELD_LABEL_CLASS}>{t('sticker.colorsLabel')}</p>
        <div className="grid grid-cols-4 gap-3">
          {COLOR_KEYS.map((key) => (
            <label key={key} className="flex flex-col items-center gap-1">
              <input
                type="color"
                value={value.colors[key]}
                onChange={(e) => setColor(key, e.target.value)}
                className="h-9 w-9 cursor-pointer rounded-full border border-border p-0"
              />
              <span className="text-[10px] text-text-muted">{t(`sticker.element.${key}`)}</span>
            </label>
          ))}
        </div>
      </div>

      {onSaveDefault && (
        <Button variant="secondary" className="w-full" disabled={saving} onClick={handleSaveDefault}>
          {saved ? t('sticker.saved') : t('sticker.saveAsDefault')}
        </Button>
      )}
    </div>
  );
}
