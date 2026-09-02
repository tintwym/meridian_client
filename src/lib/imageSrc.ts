import type { StaticImageData } from 'next/image';

/** Normalize Vite/Next static image imports to a URL string for <img src>. */
export function imageSrc(src: string | StaticImageData): string {
  return typeof src === 'string' ? src : src.src;
}
