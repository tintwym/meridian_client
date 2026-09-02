const SW_PATH = '/sw.js';

export type PushPermission = NotificationPermission | 'unsupported';

export function getPushPermission(): PushPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(SW_PATH);
  } catch {
    return null;
  }
}

export async function ensurePushPermission(): Promise<PushPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') {
    await registerPushServiceWorker();
    return 'granted';
  }
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  if (result === 'granted') await registerPushServiceWorker();
  return result;
}

export async function showMeridianPush(opts: {
  title?: string;
  body: string;
  tag?: string;
}): Promise<boolean> {
  const permission = await ensurePushPermission();
  if (permission !== 'granted') return false;

  const title = opts.title ?? 'Meridian Concierge';
  const options: NotificationOptions = {
    body: opts.body,
    tag: opts.tag ?? 'meridian-concierge',
    icon: '/icon-mark.png?v=3',
    badge: '/favicon-32.png?v=3',
  };

  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg?.showNotification) {
      await reg.showNotification(title, options);
      return true;
    }
  } catch {
    // Fall through to window Notification
  }

  try {
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}
