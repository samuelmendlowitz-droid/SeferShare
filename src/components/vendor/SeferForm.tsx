import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  SEFER_LANGUAGES,
  SEFER_TYPES,
  MAX_SEFER_IMAGES,
  type Sefer,
  type SeferLanguage,
  type SeferType,
} from '../../types';
import { getSubtypesFor, OTHER_SUBTYPE_VALUE } from '../../lib/seferTaxonomy';
import { upsertVendorListing } from '../../services/sefarim';
import { uploadSeferImages } from '../../services/storage';
import { Button } from '../ui/Button';
import { CloseIcon } from '../ui/icons';
import { NumberField } from '../ui/NumberField';
import { FIELD_LABEL_CLASS, TextField } from '../ui/TextField';

interface SeferFormProps {
  /** Pass the existing sefer to edit its listing; omit to add a new one. */
  sefer?: Sefer;
  /** This vendor's own wholesale price for `sefer`, prefilled when editing. */
  wholesalePrice?: number;
  onSaved: () => void;
  onCancel?: () => void;
}

export function SeferForm({ sefer, wholesalePrice, onSaved, onCancel }: SeferFormProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const myListing = sefer?.vendorListings.find((l) => l.vendorId === profile?.uid);

  const [hebrewName, setHebrewName] = useState(sefer?.hebrewName ?? '');
  const [englishName, setEnglishName] = useState(sefer?.englishName ?? '');
  const [phoneticName, setPhoneticName] = useState(sefer?.phoneticName ?? '');
  const [type, setType] = useState<SeferType>(sefer?.type ?? 'chumash');
  const [customType, setCustomType] = useState(sefer?.customType ?? '');
  const [subType, setSubType] = useState<string | undefined>(sefer?.subType);
  const [customSubType, setCustomSubType] = useState(sefer?.customSubType ?? '');
  const [languages, setLanguages] = useState<SeferLanguage[]>(sefer?.languages ?? []);
  const [retailPrice, setRetailPrice] = useState(myListing?.price ?? 0);
  const [wholesale, setWholesale] = useState(wholesalePrice ?? 0);
  const [stockQty, setStockQty] = useState(myListing?.stockQty ?? 0);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(myListing?.imageUrls ?? []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrls = useMemo(() => imageFiles.map((f) => URL.createObjectURL(f)), [imageFiles]);
  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  const totalImages = existingImageUrls.length + imageFiles.length;
  const subtypes = useMemo(() => getSubtypesFor(type), [type]);
  const hasCuratedSubtypes = subtypes.length > 0;

  function handleTypeChange(nextType: SeferType) {
    setType(nextType);
    setSubType((prev) => {
      if (prev === OTHER_SUBTYPE_VALUE) return prev;
      return getSubtypesFor(nextType).some((s) => s.value === prev) ? prev : undefined;
    });
  }

  /** subType is only meaningful when either a curated chip (or "Other") was
   *  picked, or — for types with no curated list at all — the vendor typed
   *  something into the always-shown custom field. */
  function resolveSubType(): string | undefined {
    if (hasCuratedSubtypes) return subType;
    return customSubType.trim() ? OTHER_SUBTYPE_VALUE : undefined;
  }

  function toggleLanguage(lang: SeferLanguage) {
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const remaining = Math.max(0, MAX_SEFER_IMAGES - existingImageUrls.length - imageFiles.length);
    setImageFiles((prev) => [...prev, ...Array.from(files).slice(0, remaining)]);
  }

  function removeExistingImage(index: number) {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNewFile(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      const uploadedUrls = imageFiles.length ? await uploadSeferImages(profile.uid, imageFiles) : [];

      await upsertVendorListing({
        seferId: sefer?.seferId,
        hebrewName,
        englishName,
        phoneticName,
        type,
        customType: type === 'other' ? customType.trim() || undefined : undefined,
        subType: resolveSubType(),
        customSubType: customSubType.trim() || undefined,
        languages,
        vendorId: profile.uid,
        vendorName: profile.displayName,
        retailPrice,
        wholesalePrice: wholesale,
        stockQty,
        imageUrls: [...existingImageUrls, ...uploadedUrls],
      });

      if (!sefer) {
        setHebrewName('');
        setEnglishName('');
        setPhoneticName('');
        setCustomType('');
        setSubType(undefined);
        setCustomSubType('');
        setLanguages([]);
        setRetailPrice(0);
        setWholesale(0);
        setStockQty(0);
        setImageFiles([]);
        setExistingImageUrls([]);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <TextField required label={t('sefer.hebrewName')} value={hebrewName} onChange={setHebrewName} />
      <TextField required label={t('sefer.englishName')} value={englishName} onChange={setEnglishName} />
      <TextField required label={t('sefer.phoneticName')} value={phoneticName} onChange={setPhoneticName} />
      <div>
        <label className={FIELD_LABEL_CLASS}>{t('sefer.type')}</label>
        <select
          value={type}
          onChange={(e) => handleTypeChange(e.target.value as SeferType)}
          className="w-full rounded-btn border border-border px-3 py-2 text-sm"
        >
          {SEFER_TYPES.map((seferType) => (
            <option key={seferType} value={seferType}>
              {t(`sefer.${seferType}`)}
            </option>
          ))}
        </select>
      </div>

      {type === 'other' && (
        <TextField
          required
          label={t('sefer.customTypeLabel')}
          value={customType}
          onChange={setCustomType}
        />
      )}

      <div>
        <p className={FIELD_LABEL_CLASS}>{t('sefer.subTypeLabel')}</p>
        {hasCuratedSubtypes && (
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
            {subtypes.map((sub) => (
              <button
                key={sub.value}
                type="button"
                onClick={() => setSubType((prev) => (prev === sub.value ? undefined : sub.value))}
                className={`shrink-0 whitespace-nowrap rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                  subType === sub.value
                    ? 'border-accent bg-accent text-white'
                    : 'border-border bg-surface text-text-muted hover:border-accent hover:text-accent'
                }`}
              >
                {sub.en} · {sub.he}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSubType((prev) => (prev === OTHER_SUBTYPE_VALUE ? undefined : OTHER_SUBTYPE_VALUE))}
              className={`shrink-0 whitespace-nowrap rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                subType === OTHER_SUBTYPE_VALUE
                  ? 'border-accent bg-accent text-white'
                  : 'border-border bg-surface text-text-muted hover:border-accent hover:text-accent'
              }`}
            >
              {t('sefer.otherOption')}
            </button>
          </div>
        )}
        {(!hasCuratedSubtypes || subType === OTHER_SUBTYPE_VALUE) && (
          <TextField label={t('sefer.customSubTypeLabel')} value={customSubType} onChange={setCustomSubType} />
        )}
      </div>

      <div>
        <p className={FIELD_LABEL_CLASS}>{t('sefer.languagesLabel')}</p>
        <div className="flex flex-wrap gap-2">
          {SEFER_LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => toggleLanguage(lang)}
              className={`rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                languages.includes(lang)
                  ? 'border-accent bg-accent text-white'
                  : 'border-border bg-surface text-text-muted hover:border-accent hover:text-accent'
              }`}
            >
              {t(`sefer.languages.${lang}`)}
            </button>
          ))}
        </div>
      </div>

      <NumberField required label={t('vendor.retailPrice')} value={retailPrice} onChange={setRetailPrice} min={0} money />
      <NumberField required label={t('vendor.wholesalePrice')} value={wholesale} onChange={setWholesale} min={0} money />
      <NumberField required label={t('vendor.stockQty')} value={stockQty} onChange={setStockQty} min={0} />

      <div>
        <p className="mb-2 text-sm text-text-muted">{t('vendor.images', { max: MAX_SEFER_IMAGES })}</p>
        <div className="flex flex-wrap gap-2">
          {existingImageUrls.map((url, index) => (
            <div key={url} className="relative h-16 w-16 shrink-0">
              <img src={url} alt="" className="h-16 w-16 rounded-btn object-cover" />
              <button
                type="button"
                onClick={() => removeExistingImage(index)}
                aria-label={t('actions.cancel')}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shadow-card"
              >
                <CloseIcon width={12} height={12} />
              </button>
            </div>
          ))}
          {previewUrls.map((url, index) => (
            <div key={url} className="relative h-16 w-16 shrink-0">
              <img src={url} alt="" className="h-16 w-16 rounded-btn object-cover" />
              <button
                type="button"
                onClick={() => removeNewFile(index)}
                aria-label={t('actions.cancel')}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shadow-card"
              >
                <CloseIcon width={12} height={12} />
              </button>
            </div>
          ))}
          {totalImages < MAX_SEFER_IMAGES && (
            <label className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-btn border border-dashed border-border text-xs text-text-muted">
              {t('vendor.addPhoto')}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancel} disabled={saving}>
            {t('actions.cancel')}
          </Button>
        )}
        <Button type="submit" className={onCancel ? 'flex-1' : undefined} disabled={saving}>
          {t('vendor.save')}
        </Button>
      </div>
    </form>
  );
}
