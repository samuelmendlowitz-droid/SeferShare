interface ImageGalleryWheelProps {
  images: string[];
  alt: string;
}

/** Swipeable photo gallery for an info page — a horizontally snap-scrolling
 *  row of full-width photos, one swipe/scroll per photo ("gallery wheel").
 *  Renders nothing when there are no photos, so callers can include it
 *  unconditionally. */
export function ImageGalleryWheel({ images, alt }: ImageGalleryWheelProps) {
  if (images.length === 0) return null;

  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1">
      {images.map((url, index) => (
        <img
          key={url}
          src={url}
          alt={`${alt} ${index + 1}`}
          className="h-48 w-full shrink-0 snap-center rounded-card border border-border object-cover"
        />
      ))}
    </div>
  );
}
