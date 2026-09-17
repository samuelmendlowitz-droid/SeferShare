import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_STICKER_DESIGN,
  nextCopyName,
  normalizeStickerDesign,
  STICKER_DEDICATION_NAME_STYLES,
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
import type { SavedStickerDesign } from '../../types';
import { CloseIcon, EditIcon, PlusIcon } from '../ui/icons';

interface StickerDesignEditorProps {
  value: StickerDesign;
  onChange: (design: StickerDesign) => void;
  content: StickerContent;
  /** The designer's saved library, most-recently-updated first — see useStickerDesigns. */
  savedDesigns: SavedStickerDesign[];
  onCreate: (design: StickerDesign, name: string) => Promise<SavedStickerDesign>;
  onUpdateContent: (designId: string, design: StickerDesign) => Promise<void>;
  onRename: (designId: string, name: string) => Promise<void>;
  onDelete: (designId: string) => Promise<void>;
}

const COLOR_KEYS: (keyof StickerColorSet)[] = [
  'background',
  'frame',
  'divider',
  'flourish',
  'label',
  'dedication',
  'donor',
  'donatedTo',
];
const FONT_OPTIONS = STICKER_FONTS.map((opt) => ({ value: opt.value, label: `${opt.en} · ${opt.he}` }));
const AUTOSAVE_DELAY_MS = 900;

/** Every edit here auto-saves to the designer's library (creating a new saved
 *  design on the first change, then updating that same one) — there is no
 *  explicit save button. Only the visual choices are persisted (StickerDesign);
 *  the donation-specific text in `content` never gets written to a saved design. */
export function StickerDesignEditor({
  value: rawValue,
  onChange,
  content,
  savedDesigns,
  onCreate,
  onUpdateContent,
  onRename,
  onDelete,
}: StickerDesignEditorProps) {
  const { t } = useTranslation();
  // Memoized so this only produces a new reference when rawValue actually
  // changes — the auto-save effect below keys off `value`, and an unmemoized
  // recompute here would give it a "new" object (and re-fire the save) on
  // every re-render, including ones caused by the save itself completing.
  const value = useMemo(() => normalizeStickerDesign(rawValue), [rawValue]);

  const [activeDesignId, setActiveDesignId] = useState<string | undefined>(() => savedDesigns[0]?.designId);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  // Whether editing an existing design should still prompt "save changes or
  // save as copy?" before the next edit auto-saves. Starts false whenever an
  // existing design is the active one (opening the editor onto your most
  // recent design counts as "opening an existing design"), and flips true —
  // no more prompting for the rest of this session — once the designer picks
  // an option, or immediately for a brand-new/unsaved design (nothing to
  // conflict with, so it can just auto-create/auto-update silently).
  const hasDecidedRef = useRef(!activeDesignId);
  const [pendingChoice, setPendingChoice] = useState(false);
  // The raw prop value as of mount (or the last explicit design switch) —
  // compared by reference below so opening the editor, or loading/starting a
  // design, never immediately saves on its own. Tracked against `rawValue`
  // rather than the memoized `value`: normalizeStickerDesign always builds a
  // fresh object, so it can never reference-equal anything computed from a
  // separate call, even for identical input. A mutable "have we run once yet"
  // flag isn't safe here either: React 18 StrictMode's dev-only double-invoke
  // of this effect would consume a one-shot flag on its first (phantom) call
  // and treat its second call as a real change. Comparing against a fixed
  // baseline is correct however many times the effect happens to run.
  const baselineRawValueRef = useRef(rawValue);
  const activeDesignIdRef = useRef(activeDesignId);
  activeDesignIdRef.current = activeDesignId;
  const savedDesignsRef = useRef(savedDesigns);
  savedDesignsRef.current = savedDesigns;

  async function saveInPlace(designId: string) {
    setSaveState('saving');
    await onUpdateContent(designId, value);
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 1500);
  }

  async function saveAsNew(name: string) {
    setSaveState('saving');
    const created = await onCreate(value, name);
    setActiveDesignId(created.designId);
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 1500);
  }

  // Auto-save: debounce so rapid slider/color changes collapse into one write.
  // Skipped entirely while a change to an existing design is awaiting the
  // designer's save-changes-or-save-as-copy choice.
  useEffect(() => {
    if (rawValue === baselineRawValueRef.current) return;
    const currentId = activeDesignIdRef.current;
    if (currentId && !hasDecidedRef.current) {
      setPendingChoice(true);
      return;
    }
    setSaveState('saving');
    const timeout = setTimeout(async () => {
      if (currentId) {
        await onUpdateContent(currentId, value);
      } else {
        const name = `${t('sticker.designDefaultName')} ${savedDesignsRef.current.length + 1}`;
        const created = await onCreate(value, name);
        setActiveDesignId(created.designId);
      }
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1500);
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawValue]);

  async function handleSaveChanges() {
    const currentId = activeDesignIdRef.current;
    if (!currentId) return;
    hasDecidedRef.current = true;
    setPendingChoice(false);
    await saveInPlace(currentId);
  }

  async function handleSaveAsCopy() {
    const original = savedDesignsRef.current.find((d) => d.designId === activeDesignIdRef.current);
    const name = nextCopyName(original?.name ?? t('sticker.designDefaultName'), savedDesignsRef.current.map((d) => d.name));
    hasDecidedRef.current = true;
    setPendingChoice(false);
    await saveAsNew(name);
  }

  function setColor(key: keyof StickerColorSet, color: string) {
    onChange({ ...value, colors: { ...value.colors, [key]: color } });
  }

  function setFont(key: StickerElementKey, font: StickerFontValue) {
    onChange({ ...value, fonts: { ...value.fonts, [key]: font } });
  }

  function handleSelectDesign(saved: SavedStickerDesign) {
    const next = normalizeStickerDesign(saved.design);
    baselineRawValueRef.current = next;
    hasDecidedRef.current = false;
    setPendingChoice(false);
    onChange(next);
    setActiveDesignId(saved.designId);
  }

  function handleNewDesign() {
    baselineRawValueRef.current = DEFAULT_STICKER_DESIGN;
    hasDecidedRef.current = true;
    setPendingChoice(false);
    onChange(DEFAULT_STICKER_DESIGN);
    setActiveDesignId(undefined);
  }

  async function handleRename(saved: SavedStickerDesign) {
    const name = window.prompt(t('sticker.renamePrompt') ?? '', saved.name);
    if (!name || !name.trim() || name.trim() === saved.name) return;
    await onRename(saved.designId, name.trim());
  }

  async function handleDelete(saved: SavedStickerDesign) {
    if (!window.confirm(t('sticker.confirmDeleteDesign') ?? '')) return;
    await onDelete(saved.designId);
    if (activeDesignId === saved.designId) {
      hasDecidedRef.current = true;
      setPendingChoice(false);
      setActiveDesignId(undefined);
    }
  }

  return (
    <div>
      <div className="sticky top-[60px] z-[5] -mx-4 bg-surface px-4 pb-3">
        <StickerPreview design={value} content={content} className="mx-auto max-w-[200px] shadow-card" />
        {pendingChoice ? (
          <div className="mt-2 rounded-btn border border-accent/30 bg-accent/5 p-2 text-center">
            <p className="text-xs text-text">{t('sticker.unsavedChangesPrompt')}</p>
            <div className="mt-2 flex gap-2">
              <Button className="flex-1" onClick={handleSaveChanges}>
                {t('sticker.saveChanges')}
              </Button>
              <Button variant="secondary" className="flex-1" onClick={handleSaveAsCopy}>
                {t('sticker.saveAsCopy')}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-center text-[10px] text-text-muted">
            {saveState === 'saving' ? t('sticker.saving') : saveState === 'saved' ? t('sticker.saved') : ' '}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <p className={FIELD_LABEL_CLASS}>{t('sticker.savedDesignsLabel')}</p>
          {savedDesigns.length > 0 && (
            <div className="mb-2 space-y-1">
              {savedDesigns.map((saved) => (
                <div
                  key={saved.designId}
                  className={`flex items-center gap-2 rounded-btn border px-3 py-2 ${
                    activeDesignId === saved.designId ? 'border-accent bg-accent/5' : 'border-border'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectDesign(saved)}
                    className="min-w-0 flex-1 truncate text-start text-sm font-medium"
                  >
                    {saved.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRename(saved)}
                    aria-label={t('sticker.renamePrompt') ?? ''}
                    className="shrink-0 text-text-muted hover:text-accent"
                  >
                    <EditIcon width={14} height={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(saved)}
                    aria-label={t('actions.delete') ?? ''}
                    className="shrink-0 text-text-muted hover:text-error"
                  >
                    <CloseIcon width={14} height={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={handleNewDesign}
            disabled={!activeDesignId}
            className="flex items-center gap-1 text-xs font-medium text-accent disabled:opacity-40"
          >
            <PlusIcon width={12} height={12} />
            {t('sticker.newDesign')}
          </button>
        </div>

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
          label={t('sticker.nameStyleLabel')}
          value={value.dedicationNameStyle}
          onChange={(v) => onChange({ ...value, dedicationNameStyle: v as StickerDesign['dedicationNameStyle'] })}
          options={STICKER_DEDICATION_NAME_STYLES.map((opt) => ({ value: opt.value, label: `${opt.en} · ${opt.he}` }))}
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
      </div>
    </div>
  );
}
