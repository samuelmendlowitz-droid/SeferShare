import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FIELD_LABEL_CLASS } from './TextField';
import { CloseIcon } from './icons';

interface ImageUploadFieldProps {
  label: string;
  /** Already-uploaded URLs (from a previous save) — removing one here just
   *  drops it from the list; nothing is deleted from storage until the form
   *  actually saves with the shorter list. */
  existingImageUrls: string[];
  onRemoveExisting: (index: number) => void;
  /** Newly-picked local files, not yet uploaded — previewed via object URLs. */
  newFiles: File[];
  onAddFiles: (files: File[]) => void;
  onRemoveNewFile: (index: number) => void;
  max: number;
}

/** Thumbnail grid + "add photo" tile for picking one or more images before a
 *  form saves — same shell for a single-image field (max=1, e.g. a neshama's
 *  photo) and a multi-image gallery (e.g. an institution's photo gallery).
 *  Mirrors the inline pattern SeferForm already used for vendor listing photos. */
export function ImageUploadField({
  label,
  existingImageUrls,
  onRemoveExisting,
  newFiles,
  onAddFiles,
  onRemoveNewFile,
  max,
}: ImageUploadFieldProps) {
  const { t } = useTranslation();
  const previewUrls = useMemo(() => newFiles.map((f) => URL.createObjectURL(f)), [newFiles]);
  const total = existingImageUrls.length + newFiles.length;

  return (
    <div>
      <p className={FIELD_LABEL_CLASS}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {existingImageUrls.map((url, index) => (
          <div key={url} className="relative h-16 w-16 shrink-0">
            <img src={url} alt="" className="h-16 w-16 rounded-btn border border-border object-cover" />
            <button
              type="button"
              onClick={() => onRemoveExisting(index)}
              aria-label={t('actions.cancel') ?? ''}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shadow-card"
            >
              <CloseIcon width={12} height={12} />
            </button>
          </div>
        ))}
        {previewUrls.map((url, index) => (
          <div key={url} className="relative h-16 w-16 shrink-0">
            <img src={url} alt="" className="h-16 w-16 rounded-btn border border-border object-cover" />
            <button
              type="button"
              onClick={() => onRemoveNewFile(index)}
              aria-label={t('actions.cancel') ?? ''}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shadow-card"
            >
              <CloseIcon width={12} height={12} />
            </button>
          </div>
        ))}
        {total < max && (
          <label className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-btn border border-dashed border-border text-xs text-text-muted">
            {t('vendor.addPhoto')}
            <input
              type="file"
              accept="image/*"
              multiple={max > 1}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []).slice(0, max - total);
                if (files.length) onAddFiles(files);
                e.target.value = '';
              }}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}
