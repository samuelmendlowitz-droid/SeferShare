import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { SEFER_TYPES, MAX_SEFER_IMAGES, type Sefer, type SeferType } from '../../types';
import { upsertVendorListing } from '../../services/sefarim';
import { uploadSeferImages } from '../../services/storage';
import { Button } from '../ui/Button';
import { CloseIcon } from '../ui/icons';

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
  const [retailPrice, setRetailPrice] = useState(myListing ? String(myListing.price) : '');
  const [wholesale, setWholesale] = useState(wholesalePrice !== undefined ? String(wholesalePrice) : '');
  const [stockQty, setStockQty] = useState(myListing ? String(myListing.stockQty) : '0');
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(myListing?.imageUrls ?? []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUrls = useMemo(() => imageFiles.map((f) => URL.createObjectURL(f)), [imageFiles]);
  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  const totalImages = existingImageUrls.length + imageFiles.length;

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
        vendorId: profile.uid,
        vendorName: profile.displayName,
        retailPrice: Number(retailPrice),
        wholesalePrice: Number(wholesale),
        stockQty: Number(stockQty),
        imageUrls: [...existingImageUrls, ...uploadedUrls],
      });

      if (!sefer) {
        setHebrewName('');
        setEnglishName('');
        setPhoneticName('');
        setRetailPrice('');
        setWholesale('');
        setStockQty('0');
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
      <input
        required
        value={hebrewName}
        onChange={(e) => setHebrewName(e.target.value)}
        placeholder={t('sefer.hebrewName') ?? ''}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      />
      <input
        required
        value={englishName}
        onChange={(e) => setEnglishName(e.target.value)}
        placeholder={t('sefer.englishName') ?? ''}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      />
      <input
        required
        value={phoneticName}
        onChange={(e) => setPhoneticName(e.target.value)}
        placeholder={t('sefer.phoneticName') ?? ''}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as SeferType)}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      >
        {SEFER_TYPES.map((seferType) => (
          <option key={seferType} value={seferType}>
            {t(`sefer.${seferType}`)}
          </option>
        ))}
      </select>
      <input
        required
        type="number"
        min="0"
        step="0.01"
        value={retailPrice}
        onChange={(e) => setRetailPrice(e.target.value)}
        placeholder={t('vendor.retailPrice') ?? ''}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      />
      <input
        required
        type="number"
        min="0"
        step="0.01"
        value={wholesale}
        onChange={(e) => setWholesale(e.target.value)}
        placeholder={t('vendor.wholesalePrice') ?? ''}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      />
      <input
        required
        type="number"
        min="0"
        step="1"
        value={stockQty}
        onChange={(e) => setStockQty(e.target.value)}
        placeholder={t('vendor.stockQty') ?? ''}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      />

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
