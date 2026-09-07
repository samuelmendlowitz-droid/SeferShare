import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { SEFER_TYPES, type SeferType } from '../../types';
import { upsertVendorListing } from '../../services/sefarim';
import { uploadSeferImage } from '../../services/storage';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface SeferFormProps {
  onSaved: () => void;
}

export function SeferForm({ onSaved }: SeferFormProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [hebrewName, setHebrewName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [phoneticName, setPhoneticName] = useState('');
  const [type, setType] = useState<SeferType>('chumash');
  const [retailPrice, setRetailPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [inStock, setInStock] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) imageUrl = await uploadSeferImage(profile.uid, imageFile);

      await upsertVendorListing({
        hebrewName,
        englishName,
        phoneticName,
        type,
        vendorId: profile.uid,
        vendorName: profile.displayName,
        retailPrice: Number(retailPrice),
        wholesalePrice: Number(wholesalePrice),
        inStock,
        imageUrl,
      });

      setHebrewName('');
      setEnglishName('');
      setPhoneticName('');
      setRetailPrice('');
      setWholesalePrice('');
      setImageFile(null);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
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
          value={wholesalePrice}
          onChange={(e) => setWholesalePrice(e.target.value)}
          placeholder={t('vendor.wholesalePrice') ?? ''}
          className="w-full rounded-btn border border-border px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
          {t('vendor.inStock')}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm"
        />
        <Button type="submit" disabled={saving}>
          {t('vendor.save')}
        </Button>
      </form>
    </Card>
  );
}
