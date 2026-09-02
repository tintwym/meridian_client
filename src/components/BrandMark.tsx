import markUrl from '../assets/meridian-mark.png';
import { imageSrc } from '../lib/imageSrc';

/** Meridian circular lockup — bundled so Docker/Vite always ship the mark. */
export default function BrandMark({
  size = 36,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={imageSrc(markUrl)}
      alt=""
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`.trim()}
      decoding="async"
    />
  );
}
