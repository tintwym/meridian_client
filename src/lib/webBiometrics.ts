/**
 * Web platform authenticator — fingerprint / Windows Hello via WebAuthn.
 */

const CRED_KEY = 'meridian.auth.webauthn.credId';
const BIO_KEY = 'meridian.auth.biometricEnabled';

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  bytes.forEach((b) => {
    s += String.fromCharCode(b);
  });
  return btoa(s);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const s = atob(b64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes.buffer;
}

export function isWebFingerprintAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.PublicKeyCredential &&
    typeof navigator.credentials?.create === 'function'
  );
}

export function isWebFingerprintEnabled(): boolean {
  try {
    return localStorage.getItem(BIO_KEY) === '1' && !!localStorage.getItem(CRED_KEY);
  } catch {
    return false;
  }
}

export function setWebFingerprintEnabled(on: boolean) {
  if (on) localStorage.setItem(BIO_KEY, '1');
  else {
    localStorage.removeItem(BIO_KEY);
    localStorage.removeItem(CRED_KEY);
  }
}

/** Enroll platform authenticator (Touch ID / Windows Hello fingerprint, etc.). */
export async function enrollWebFingerprint(userId: string, email: string, displayName: string) {
  if (!isWebFingerprintAvailable()) {
    throw new Error('Fingerprint unlock is not supported in this browser');
  }
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userIdBytes = new TextEncoder().encode(userId);
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: {
        name: 'Meridian Atelier',
        id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      },
      user: {
        id: userIdBytes,
        name: email,
        displayName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;

  if (!cred) throw new Error('Fingerprint enrollment cancelled');
  localStorage.setItem(CRED_KEY, bufferToBase64(cred.rawId));
  localStorage.setItem(BIO_KEY, '1');
}

/** Prompt fingerprint / platform unlock. */
export async function unlockWithWebFingerprint(): Promise<void> {
  const credId = localStorage.getItem(CRED_KEY);
  if (!credId) throw new Error('No fingerprint enrolled');
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [
        {
          id: base64ToBuffer(credId),
          type: 'public-key',
          transports: ['internal'],
        },
      ],
      userVerification: 'required',
      timeout: 60_000,
    },
  });
  if (!assertion) throw new Error('Fingerprint unlock cancelled');
}
