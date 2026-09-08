import { BookIcon } from './icons';

interface SeferThumbnailProps {
  imageUrl?: string;
  alt: string;
  size?: number;
}

/** Shopping-site style product image, with a placeholder icon when a sefer has no photo. */
export function SeferThumbnail({ imageUrl, alt, size = 56 }: SeferThumbnailProps) {
  const style = { width: size, height: size };
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        style={style}
        className="shrink-0 rounded-btn border border-border object-cover"
      />
    );
  }
  return (
    <div
      style={style}
      className="flex shrink-0 items-center justify-center rounded-btn border border-border bg-bg text-text-muted"
    >
      <BookIcon width={size * 0.4} height={size * 0.4} />
    </div>
  );
}
