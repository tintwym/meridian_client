/** Detect whether to show the native-style app shell vs the marketing site. */

export function isNativeWebView(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /MeridianAtelier(Android|iOS)/i.test(navigator.userAgent);
}

/**
 * App shell (Home / Plan / Inquire / Club) only for:
 * - native iOS / Android WebViews, or
 * - explicit ?app=1 / ?mode=app
 *
 * All normal browsers (phone + desktop) get the marketing landing —
 * Trip/Agoda-style discovery first.
 */
export function preferAppShell(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  if (params.get('app') === '0' || params.get('mode') === 'web') return false;
  if (params.get('app') === '1' || params.get('mode') === 'app') return true;

  return isNativeWebView();
}
