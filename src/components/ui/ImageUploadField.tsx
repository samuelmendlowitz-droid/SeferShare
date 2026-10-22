import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FIELD_LABEL_CLASS } from './TextField';
import { CloseIcon } from './icons';

/** An already-uploaded photo (by URL) or a newly-picked local file not yet
 *  uploaded — kept in one ordered list so a single array index can serve as
 *  both "which photo" and "is it the primary one" (always index 0). */
export type ImageItem = { kind: 'existing'; url: string } | { kind: 'new'; file: File };

export function isNewImage(item: ImageItem): item is { kind: 'new'; file: File } {
  return item.kind === 'new';
}

/** Resolves a final list of URLs for saving: uploads every 'new' file (via
 *  `uploadFiles`, in order) and splices the results back into their original
 *  positions alongside the already-existing URLs. */
export async function resolveImageUrls(
  items: ImageItem[],
  uploadFiles: (files: File[]) => Promise<string[]>,
): Promise<string[]> {
  const newFiles = items.filter(isNewImage).map((item) => item.file);
  const uploadedUrls = newFiles.length ? await uploadFiles(newFiles) : [];
  let nextUpload = 0;
  return items.map((item) => (item.kind === 'existing' ? item.url : uploadedUrls[nextUpload++]));
}

interface ImageUploadFieldProps {
  label: string;
  items: ImageItem[];
  onChange: (items: ImageItem[]) => void;
  max: number;
  /** Only meaningful when max > 1: marks items[0] as "Primary" (the photo
   *  shown on the item's info card) and lets tapping any other photo promote
   *  it to that spot instead. */
  allowPrimarySelection?: boolean;
}

/** Thumbnail grid + "add photo" tile for picking one or more images before a
 *  form saves — same shell for a single-image field (max=1, e.g. a neshama's
 *  portrait) and a multi-image gallery with a selectable primary (e.g. an
 *  institution's or campaign's photos). */
export function ImageUploadField({ label, items, onChange, max, allowPrimarySelection }: ImageUploadFieldProps) {
  const { t } = useTranslation();
  const previewUrls = useMemo(
    () => new Map(items.filter(isNewImage).map((item) => [item.file, URL.createObjectURL(item.file)])),
    [items],
  );

  function removeAt(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function makePrimary(index: number) {
    if (!allowPrimarySelection || index === 0) return;
    const next = [...items];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    onChange(next);
  }

  function addFiles(files: File[]) {
    const capped = files.slice(0, max - items.length);
    if (capped.length) onChange([...items, ...capped.map((file): ImageItem => ({ kind: 'new', file }))]);
  }

  return (
    <div>
      <p className={FIELD_LABEL_CLASS}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => {
          const url = item.kind === 'existing' ? item.url : (previewUrls.get(item.file) ?? '');
          const isPrimary = Boolean(allowPrimarySelection) && index === 0;
          return (
            <div key={item.kind === 'existing' ? item.url : `${item.file.name}-${item.file.lastModified}`} className="relative h-16 w-16 shrink-0">
              {allowPrimarySelection ? (
                <button
                  type="button"
                  onClick={() => makePrimary(index)}
                  aria-label={isPrimary ? (t('actions.primary') ?? '') : (t('actions.setPrimary') ?? '')}
                  className={`block h-16 w-16 overflow-hidden rounded-btn border object-cover ${
                    isPrimary ? 'border-2 border-accent' : 'border-border'
                  }`}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ) : (
                <img src={url} alt="" className="h-16 w-16 rounded-btn border border-border object-cover" />
              )}
              {isPrimary && (
                <span className="absolute -top-1.5 start-1/2 -translate-x-1/2 whitespace-nowrap rounded-pill bg-accent px-1.5 py-0 text-[9px] font-semibold text-white">
                  {t('actions.primary')}
                </span>
              )}
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label={t('actions.cancel') ?? ''}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shadow-card"
              >
                <CloseIcon width={12} height={12} />
              </button>
            </div>
          );
        })}
        {items.length < max && (
          <label className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-btn border border-dashed border-border text-xs text-text-muted">
            {t('vendor.addPhoto')}
            <input
              type="file"
              accept="image/*"
              multiple={max > 1}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) addFiles(files);
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
