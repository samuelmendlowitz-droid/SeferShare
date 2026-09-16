import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  normalizeStickerDesign,
  STICKER_DEDICATION_PHRASES,
  STICKER_DIVIDERS,
  STICKER_FLOURISHES,
  STICKER_FONTS,
  STICKER_FRAMES,
  STICKER_LAYOUTS,
  STICKER_TEXT_ELEMENTS,
  type StickerColorSet,
  type StickerDesign,
  type StickerElementKey,
  type StickerFontValue,
} from '../../lib/stickerDesign';
import { StickerPreview, type StickerContent } from './StickerPreview';
import { SliderPicker } from '../ui/SliderPicker';
import { FIELD_LABEL_CLASS } from '../ui/TextField';
import { Button } from '../ui/Button';

interface StickerDesignEditorProps {
  value: StickerDesign;
  onChange: (design: StickerDesign) => void;
  content: StickerContent;
  onSaveDefault?: () => Promise<void> | void;
}

const COLOR_KEYS: (keyof StickerColorSet)[] = ['background', 'frame', 'divider', 'flourish', 'label', 'dedication', 'donor'];

const FONT_OPTIONS = STICKER_FONTS.map((opt) => ({ value: opt.value, label: `${opt.en} · ${opt.he}` }));

export function StickerDesignEditor({ value: rawValue, onChange, content, onSaveDefault }: StickerDesignEditorProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // Defensive: `value` may be a design saved before a schema change (e.g. missing
  // per-element fonts) — never assume it's actually complete just because its
  // type says so.
  const value = normalizeStickerDesign(rawValue);

  function setColor(key: keyof StickerColorSet, color: string) {
    onChange({ ...value, colors: { ...value.colors, [key]: color } });
  }

  function setFont(key: StickerElementKey, font: StickerFontValue) {
    onChange({ ...value, fonts: { ...value.fonts, [key]: font } });
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
    <div>
      <div className="sticky top-[60px] z-[5] -mx-4 bg-surface px-4 pb-3">
        <StickerPreview design={value} content={content} className="mx-auto max-w-[200px] shadow-card" />
      </div>

      <div className="space-y-4">
        <SliderPicker
          label={t('sticker.layoutLabel')}
          value={value.layout}
          onChange={(v) => onChange({ ...value, layout: v })}
          options={STICKER_LAYOUTS.map((opt) => ({ value: opt.value, label: `${opt.en} · ${opt.he}` }))}
        />

        <SliderPicker
          label={t('sticker.phraseLabel')}
          value={value.dedicationPhrase}
          onChange={(v) => onChange({ ...value, dedicationPhrase: v })}
          options={STICKER_DEDICATION_PHRASES.map((opt) => ({ value: opt.value, label: `${opt.en} · ${opt.he}` }))}
        />

        <SliderPicker
          label={t('sticker.frameLabel')}
          value={value.frame}
          onChange={(v) => onChange({ ...value, frame: v as StickerDesign['frame'] })}
          options={STICKER_FRAMES.map((opt) => ({ value: opt.value, label: `${opt.en} · ${opt.he}` }))}
        />

        <SliderPicker
          label={t('sticker.dividerLabel')}
          value={value.divider}
          onChange={(v) => onChange({ ...value, divider: v as StickerDesign['divider'] })}
          options={STICKER_DIVIDERS.map((opt) => ({ value: opt.value, label: `${opt.en} · ${opt.he}` }))}
        />

        <SliderPicker
          label={t('sticker.flourishLabel')}
          value={value.flourish}
          onChange={(v) => onChange({ ...value, flourish: v as StickerDesign['flourish'] })}
          options={STICKER_FLOURISHES.map((opt) => ({ value: opt.value, label: `${opt.en} · ${opt.he}` }))}
        />

        <div>
          <p className={FIELD_LABEL_CLASS}>{t('sticker.fontsLabel')}</p>
          <div className="space-y-2">
            {STICKER_TEXT_ELEMENTS.map((key) => (
              <SliderPicker
                key={key}
                label={t(`sticker.element.${key}`)}
                value={value.fonts[key]}
                onChange={(v) => setFont(key, v as StickerFontValue)}
                options={FONT_OPTIONS}
                compact
              />
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
    </div>
  );
}
