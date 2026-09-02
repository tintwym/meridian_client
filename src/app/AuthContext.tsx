import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  clearSession,
  loadToken,
  loadUser,
  persistSession,
  type AuthUser,
} from '../api/authStorage';
import {
  fetchClub,
  fetchMe,
  loginAccount,
  registerAccount,
  requestOtp,
  setPlatformUnauthorizedHandler,
  socialSignIn,
  updateProfile,
  verifyOtp,
  type ClubSummary,
} from '../api/platform';
import {
  enrollWebFingerprint,
  isWebFingerprintAvailable,
  isWebFingerprintEnabled,
  setWebFingerprintEnabled,
  unlockWithWebFingerprint,
} from '../lib/webBiometrics';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  club: ClubSummary | null;
  ready: boolean;
  isUnlocked: boolean;
  fingerprintEnabled: boolean;
  fingerprintAvailable: boolean;
  pendingFingerprintEnrollment: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  requestEmailOtp: (email: string) => Promise<{ message: string; devCode?: string; otpTicket?: string }>;
  verifyEmailOtp: (
    email: string,
    code: string,
    opts?: { password?: string; name?: string; otpTicket?: string },
  ) => Promise<void>;
  continueWithGoogle: (opts?: { email?: string; name?: string; idToken?: string }) => Promise<void>;
  continueWithApple: (opts?: {
    email?: string;
    name?: string;
    idToken?: string;
    subject?: string;
  }) => Promise<void>;
  unlockWithFingerprint: () => Promise<void>;
  enrollFingerprint: () => Promise<void>;
  skipFingerprintEnrollment: () => void;
  enableFingerprintFromSettings: () => Promise<void>;
  disableFingerprintFromSettings: () => void;
  updateAccountProfile: (name: string) => Promise<void>;
  signOut: () => void;
  refreshClub: () => Promise<void>;
  setUserPoints: (points: number, creditUsd: number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadUser());
  const [token, setToken] = useState<string | null>(() => loadToken());
  const [club, setClub] = useState<ClubSummary | null>(null);
  const [ready, setReady] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [fingerprintEnabled, setFingerprintEnabled] = useState(() => isWebFingerprintEnabled());
  const [pendingFingerprintEnrollment, setPendingFingerprintEnrollment] = useState(false);
  const fingerprintAvailable = isWebFingerprintAvailable();

  const refreshClub = useCallback(async () => {
    if (!loadToken()) {
      setClub(null);
      return;
    }
    try {
      const summary = await fetchClub();
      setClub(summary);
      setUser((prev) =>
        prev ? { ...prev, points: summary.points, creditUsd: summary.creditUsd } : prev,
      );
    } catch {
      /* offline */
    }
  }, []);

  const applySession = useCallback(
    async (next: AuthUser, t: string, offerFingerprint = false) => {
      persistSession(t, next);
      setToken(t);
      setUser(next);
      setIsUnlocked(true);
      await refreshClub();
      if (offerFingerprint && fingerprintAvailable && !isWebFingerprintEnabled()) {
        setPendingFingerprintEnrollment(true);
      }
    },
    [refreshClub, fingerprintAvailable],
  );

  useEffect(() => {
    setPlatformUnauthorizedHandler(() => {
      clearSession();
      setUser(null);
      setToken(null);
      setClub(null);
      setIsUnlocked(false);
    });
    return () => setPlatformUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = loadToken();
      const bio = isWebFingerprintEnabled();
      setFingerprintEnabled(bio);

      if (!stored) {
        if (!cancelled) {
          setReady(true);
          setIsUnlocked(false);
        }
        return;
      }

      if (bio) {
        // Keep cached profile; require fingerprint before live session.
        if (!cancelled) {
          setToken(null);
          setIsUnlocked(false);
          setReady(true);
        }
        return;
      }

      try {
        const me = await fetchMe();
        if (cancelled) return;
        setUser(me);
        persistSession(stored, me);
        setToken(stored);
        setIsUnlocked(true);
        await refreshClub();
      } catch {
        if (!cancelled) {
          clearSession();
          setUser(null);
          setToken(null);
          setIsUnlocked(false);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshClub]);

  const unlockWithFingerprint = useCallback(async () => {
    await unlockWithWebFingerprint();
    const stored = loadToken();
    if (!stored) throw new Error('No saved session — sign in again');
    const me = await fetchMe();
    setToken(stored);
    setUser(me);
    setIsUnlocked(true);
    await refreshClub();
  }, [refreshClub]);

  const enrollFingerprint = useCallback(async () => {
    if (!user || !token) return;
    await enrollWebFingerprint(user.id, user.email, user.name);
    setFingerprintEnabled(true);
    setPendingFingerprintEnrollment(false);
    setIsUnlocked(true);
  }, [user, token]);

  const skipFingerprintEnrollment = useCallback(() => {
    setPendingFingerprintEnrollment(false);
  }, []);

  const enableFingerprintFromSettings = useCallback(async () => {
    if (!user || !token) throw new Error('Sign in first');
    await enrollWebFingerprint(user.id, user.email, user.name);
    setFingerprintEnabled(true);
  }, [user, token]);

  const disableFingerprintFromSettings = useCallback(() => {
    setWebFingerprintEnabled(false);
    setFingerprintEnabled(false);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { user: next, token: t } = await loginAccount(email, password);
      await applySession(next, t, true);
    },
    [applySession],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const { user: next, token: t } = await registerAccount(email, password, name);
      await applySession(next, t, true);
    },
    [applySession],
  );

  const requestEmailOtp = useCallback(async (email: string) => {
    const res = await requestOtp(email);
    return { message: res.message, devCode: res.devCode, otpTicket: res.otpTicket };
  }, []);

  const verifyEmailOtpFn = useCallback(
    async (
      email: string,
      code: string,
      opts?: { password?: string; name?: string; otpTicket?: string },
    ) => {
      const { user: next, token: t } = await verifyOtp(email, code, opts);
      await applySession(next, t, true);
    },
    [applySession],
  );

  const continueWithGoogle = useCallback(
    async (opts?: { email?: string; name?: string; idToken?: string }) => {
      const { user: next, token: t } = await socialSignIn({
        provider: 'google',
        idToken: opts?.idToken,
        email: opts?.email,
        name: opts?.name,
      });
      await applySession(next, t, true);
    },
    [applySession],
  );

  const continueWithApple = useCallback(
    async (opts?: { email?: string; name?: string; idToken?: string; subject?: string }) => {
      const { user: next, token: t } = await socialSignIn({
        provider: 'apple',
        idToken: opts?.idToken,
        email: opts?.email,
        name: opts?.name,
        subject: opts?.subject,
      });
      await applySession(next, t, true);
    },
    [applySession],
  );

  const signOut = useCallback(() => {
    clearSession();
    setWebFingerprintEnabled(false);
    setFingerprintEnabled(false);
    setToken(null);
    setUser(null);
    setClub(null);
    setIsUnlocked(false);
    setPendingFingerprintEnrollment(false);
  }, []);

  const updateAccountProfile = useCallback(async (name: string) => {
    const stored = loadToken();
    if (!stored) throw new Error('Sign in first');
    const next = await updateProfile(name);
    persistSession(stored, next);
    setUser(next);
  }, []);

  const setUserPoints = useCallback((points: number, creditUsd: number) => {
    setUser((prev) => (prev ? { ...prev, points, creditUsd } : prev));
    setClub((prev) => (prev ? { ...prev, points, creditUsd } : prev));
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      club,
      ready,
      isUnlocked,
      fingerprintEnabled,
      fingerprintAvailable,
      pendingFingerprintEnrollment,
      signIn,
      signUp,
      requestEmailOtp,
      verifyEmailOtp: verifyEmailOtpFn,
      continueWithGoogle,
      continueWithApple,
      unlockWithFingerprint,
      enrollFingerprint,
      skipFingerprintEnrollment,
      enableFingerprintFromSettings,
      disableFingerprintFromSettings,
      updateAccountProfile,
      signOut,
      refreshClub,
      setUserPoints,
    }),
    [
      user,
      token,
      club,
      ready,
      isUnlocked,
      fingerprintEnabled,
      fingerprintAvailable,
      pendingFingerprintEnrollment,
      signIn,
      signUp,
      requestEmailOtp,
      verifyEmailOtpFn,
      continueWithGoogle,
      continueWithApple,
      unlockWithFingerprint,
      enrollFingerprint,
      skipFingerprintEnrollment,
      enableFingerprintFromSettings,
      disableFingerprintFromSettings,
      updateAccountProfile,
      signOut,
      refreshClub,
      setUserPoints,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth requires AuthProvider');
  return ctx;
}
