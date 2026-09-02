/**
 * API mode:
 * - mock — all client calls use local mocks (no network)
 * - live — all calls hit /api/* (real backend when ready)
 * - auto — live for existing Express routes; mock for not-yet-backed features
 */
import type { ApiMode } from './types';

function publicEnv(name: string): string | undefined {
  if (typeof process === 'undefined') return undefined;
  const value = process.env[name];
  return value === undefined || value === '' ? undefined : value;
}

export function getApiMode(): ApiMode {
  const raw =
    publicEnv('NEXT_PUBLIC_API_MODE')?.toLowerCase() ??
    publicEnv('VITE_API_MODE')?.toLowerCase();
  if (raw === 'mock' || raw === 'live' || raw === 'auto') return raw;

  const legacy =
    publicEnv('NEXT_PUBLIC_USE_MOCK_API')?.toLowerCase() ??
    publicEnv('VITE_USE_MOCK_API')?.toLowerCase();
  if (legacy === 'true' || legacy === '1') return 'mock';
  if (legacy === 'false' || legacy === '0') return 'live';

  if (process.env.NODE_ENV === 'production') return 'live';

  return 'auto';
}

export function shouldMockUnbacked(): boolean {
  return getApiMode() !== 'live';
}

export function shouldMockLiveRoutes(): boolean {
  return getApiMode() === 'mock';
}

declare global {
  interface Window {
    __MERIDIAN_API_BASE__?: string;
  }
}

export function apiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.__MERIDIAN_API_BASE__) {
    return window.__MERIDIAN_API_BASE__.replace(/\/$/, '');
  }
  const base =
    publicEnv('NEXT_PUBLIC_API_BASE_URL') ?? publicEnv('VITE_API_BASE_URL');
  return base?.replace(/\/$/, '') || '';
}

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${apiBaseUrl()}${p}`;
}
