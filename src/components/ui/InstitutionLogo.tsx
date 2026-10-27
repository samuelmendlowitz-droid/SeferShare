interface InstitutionLogoProps {
  logoUrl?: string;
  alt: string;
  size?: number;
}

/** An institution's small mark, shown next to its name wherever it's
 *  referenced (its own card, a campaign's card/detail page). Unlike a gallery
 *  photo it's never cropped (object-contain on a neutral backdrop), so a
 *  non-square logo or one with a transparent background still reads cleanly.
 *  Renders nothing when there's no logo, so callers can include it
 *  unconditionally. */
export function InstitutionLogo({ logoUrl, alt, size = 20 }: InstitutionLogoProps) {
  if (!logoUrl) return null;
  return (
    <img
      src={logoUrl}
      alt={alt}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-btn border border-border bg-white object-contain p-0.5"
    />
  );
}
