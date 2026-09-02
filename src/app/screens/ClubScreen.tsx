import { useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Eye, EyeOff, Fingerprint, Heart, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { AppleMark, GoogleMark } from '../components/SocialMarks';
import {
  addWishlistItem,
  CONSULT_STATUS_LABELS,
  listInquiries,
  listVault,
  listWishlist,
  removeWishlistItem,
  type ConsultStatus,
  type InquiryRecord,
  type VaultDoc,
  type WishlistItem,
} from '../../api/platform';
import { subscribeClubInquiries } from '../../lib/subscribeClubInquiries';
import { getPushPermission, showMeridianPush } from '../../lib/pushNotifications';
import ClubGuestPanel from '../components/ClubGuestPanel';
import CommunicationSuite from '../components/CommunicationSuite';

const clubEase = [0.22, 1, 0.36, 1] as const;

type ClubPane = 'overview' | 'wishlist' | 'status' | 'guests' | 'vault' | 'settings';

export default function ClubScreen() {
  const {
    user,
    club,
    ready,
    isUnlocked,
    fingerprintEnabled,
    fingerprintAvailable,
    pendingFingerprintEnrollment,
    signIn,
    signOut,
    refreshClub,
    setUserPoints,
    requestEmailOtp,
    verifyEmailOtp,
    continueWithGoogle,
    continueWithApple,
    unlockWithFingerprint,
    enrollFingerprint,
    skipFingerprintEnrollment,
    enableFingerprintFromSettings,
    disableFingerprintFromSettings,
    updateAccountProfile,
  } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'join'>('signIn');
  const [joinStep, setJoinStep] = useState<'credentials' | 'otp'>('credentials');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [otpTicket, setOtpTicket] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pane, setPane] = useState<ClubPane>('overview');
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [vault, setVault] = useState<VaultDoc[]>([]);
  const [wishLabel, setWishLabel] = useState('');
  const [wishType, setWishType] = useState<'local' | 'overseas'>('overseas');
  const [settingsNote, setSettingsNote] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [showFingerPrompt, setShowFingerPrompt] = useState(false);
  const [socialProvider, setSocialProvider] = useState<'google' | 'apple' | null>(null);
  const [socialEmailDraft, setSocialEmailDraft] = useState('');
  const [socialBusy, setSocialBusy] = useState(false);

  useEffect(() => {
    if (pendingFingerprintEnrollment) setShowFingerPrompt(true);
  }, [pendingFingerprintEnrollment]);

  useEffect(() => {
    if (user?.name) setProfileName(user.name);
  }, [user?.id, user?.name]);

  useEffect(() => {
    if (!socialProvider) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !socialBusy) {
        setSocialProvider(null);
        setSocialEmailDraft('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [socialProvider, socialBusy]);

  useEffect(() => {
    if (!user || !isUnlocked) return;
    void refreshClub();
  }, [user, isUnlocked, refreshClub]);

  useEffect(() => {
    if (!user || !isUnlocked) return;
    let cancelled = false;
    (async () => {
      try {
        const [w, i, v] = await Promise.all([listWishlist(), listInquiries(), listVault()]);
        if (cancelled) return;
        setWishlist(w);
        setInquiries(i);
        setVault(v);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isUnlocked, pane]);

  // Live Consult status (Supabase Realtime) — updates without refreshing the pane
  useEffect(() => {
    if (!user || !isUnlocked) return;
    return subscribeClubInquiries(user.id, (inquiry) => {
      setInquiries((prev) => {
        const prior = prev.find((row) => row.id === inquiry.id);
        const idx = prev.findIndex((row) => row.id === inquiry.id);
        if (idx === -1) return [inquiry, ...prev];
        const next = [...prev];
        next[idx] = { ...next[idx], ...inquiry };

        if (
          prior &&
          prior.status !== inquiry.status &&
          getPushPermission() === 'granted'
        ) {
          const label = CONSULT_STATUS_LABELS[inquiry.status as ConsultStatus] ?? inquiry.status;
          void showMeridianPush({
            title: 'Meridian Consult',
            body: `Status updated: ${label}`,
            tag: `consult-${inquiry.id}`,
          });
        }

        return next;
      });
      void refreshClub();
    });
  }, [user, isUnlocked, refreshClub]);

  const onAuth = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signIn') {
        await signIn(email, password);
        return;
      }

      // Join: credentials → OTP verify (creates account with password)
      if (joinStep === 'credentials') {
        if (!name.trim()) throw new Error('Enter your name');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');
        if (password !== confirmPassword) throw new Error('Passwords do not match');
        const res = await requestEmailOtp(email);
        setOtpHint(res.devCode ? `Your verification code is ${res.devCode}.` : res.message);
        setOtpTicket(res.otpTicket ?? null);
        setJoinStep('otp');
      } else {
        await verifyEmailOtp(email, otpCode, {
          password,
          name: name.trim(),
          otpTicket: otpTicket ?? undefined,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  const openSocial = (provider: 'google' | 'apple') => {
    setError(null);
    setSocialProvider(provider);
    setSocialEmailDraft(email.trim());
  };

  const closeSocial = () => {
    if (socialBusy) return;
    setSocialProvider(null);
    setSocialEmailDraft('');
  };

  const confirmSocial = async (e: FormEvent) => {
    e.preventDefault();
    if (!socialProvider) return;
    const socialEmail = socialEmailDraft.trim().toLowerCase();
    if (!socialEmail.includes('@')) {
      setError('Enter a valid email to continue with Apple or Google');
      return;
    }
    setSocialBusy(true);
    setBusy(true);
    setError(null);
    try {
      if (socialProvider === 'google') {
        await continueWithGoogle({ email: socialEmail, name: name.trim() || undefined });
      } else {
        await continueWithApple({ email: socialEmail, name: name.trim() || undefined });
      }
      setSocialProvider(null);
      setSocialEmailDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Social sign-in failed');
    } finally {
      setSocialBusy(false);
      setBusy(false);
    }
  };

  const addWish = async (e: FormEvent) => {
    e.preventDefault();
    if (!wishLabel.trim()) return;
    const item = await addWishlistItem(wishLabel.trim(), wishType);
    setWishlist((prev) => [item, ...prev]);
    setWishLabel('');
  };

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center bg-paper px-5 py-16">
        <p className="font-app-sans text-sm text-ink/50">Loading Club…</p>
      </div>
    );
  }

  if (fingerprintEnabled && !isUnlocked) {
    return (
      <motion.div
        key="unlock"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: clubEase }}
        className="flex min-h-full flex-col items-center justify-center gap-5 bg-paper px-6 text-center text-ink"
      >
        <Fingerprint className="h-12 w-12 text-atlantic" />
        <h1 className="font-app-display text-3xl">
          Welcome back{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="max-w-sm font-app-sans text-sm text-ink/55">
          Unlock Meridian Club with your fingerprint (or device biometrics).
        </p>
        {error && <p className="font-app-sans text-sm text-rose-700">{error}</p>}
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await unlockWithFingerprint();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Unlock failed');
            } finally {
              setBusy(false);
            }
          }}
          className="app-btn app-btn-ink max-w-sm"
        >
          {busy ? 'Waiting…' : 'Unlock with fingerprint'}
        </button>
        <button
          type="button"
          onClick={signOut}
          className="font-app-sans text-xs text-ink/45 transition-colors hover:text-ink/70"
        >
          Sign in with email instead
        </button>
      </motion.div>
    );
  }

  if (!user || !isUnlocked) {
    return (
      <motion.div
        key="auth"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.28, ease: clubEase }}
        className="min-h-full bg-paper text-ink"
        style={{ transform: 'none' }}
      >
        <header
          className="sticky top-0 z-20 border-b border-ink/8 bg-paper/95 px-5 py-4 backdrop-blur-md"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <p className="font-app-sans text-[11px] font-medium tracking-[0.22em] text-atlantic uppercase">
            Meridian Club
          </p>
          <h1 className="font-app-display text-2xl tracking-tight">Atelier credit & perks</h1>
        </header>

        <div className="mx-auto max-w-md space-y-6 px-5 py-8">
          <p className="font-app-sans text-sm leading-relaxed text-ink/60">
            {mode === 'join'
              ? 'Create your account with email and password, verify with a one-time code, then optionally add fingerprint unlock.'
              : 'Sign in with your email and password. Use fingerprint unlock if you’ve enabled it in Settings.'}
          </p>

          <div className="grid gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => openSocial('apple')}
              className="app-btn app-btn-ink inline-flex items-center justify-center gap-2.5"
            >
              <AppleMark className="h-4 w-4 shrink-0" />
              Continue with Apple
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => openSocial('google')}
              className="app-btn app-btn-ghost inline-flex items-center justify-center gap-2.5"
            >
              <GoogleMark className="h-4 w-4 shrink-0" />
              Continue with Google
            </button>
          </div>

          <AnimatePresence>
          {socialProvider && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: clubEase }}
              className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 px-4 pb-8 sm:items-center sm:pb-0"
              role="dialog"
              aria-modal="true"
              aria-labelledby="social-sign-in-title"
              onClick={closeSocial}
            >
              <motion.form
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.34, ease: clubEase }}
                onSubmit={confirmSocial}
                onClick={(ev) => ev.stopPropagation()}
                className="w-full max-w-md space-y-4 rounded-2xl border border-ink/10 bg-paper p-5 shadow-xl"
              >
                <div>
                  <h2 id="social-sign-in-title" className="font-app-display text-xl text-ink">
                    Continue with {socialProvider === 'apple' ? 'Apple' : 'Google'}
                  </h2>
                  <p className="mt-1 font-app-sans text-sm text-ink/55">
                    Confirm the email linked to your {socialProvider === 'apple' ? 'Apple' : 'Google'}{' '}
                    account to enter Club.
                  </p>
                </div>
                <label className="block space-y-1.5">
                  <span className="font-app-sans text-[11px] tracking-[0.16em] text-ink/50 uppercase">
                    Email
                  </span>
                  <input
                    autoFocus
                    required
                    type="email"
                    autoComplete="email"
                    value={socialEmailDraft}
                    onChange={(e) => setSocialEmailDraft(e.target.value)}
                    className="app-input w-full"
                    placeholder="you@example.com"
                  />
                </label>
                {error && (
                  <p className="font-app-sans text-sm text-red-700/90" role="alert">
                    {error}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={socialBusy}
                    onClick={closeSocial}
                    className="app-btn app-btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={socialBusy || !socialEmailDraft.includes('@')}
                    className="app-btn app-btn-ink flex-1"
                  >
                    {socialBusy ? 'Signing in…' : 'Continue'}
                  </button>
                </div>
              </motion.form>
            </motion.div>
          )}
          </AnimatePresence>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-ink/10" />
            <span className="font-app-sans text-[11px] tracking-wide text-ink/40 uppercase">or email</span>
            <div className="h-px flex-1 bg-ink/10" />
          </div>

          <div className="flex gap-0 border-b border-ink/10">
            {(
              [
                ['signIn', 'Sign in'],
                ['join', 'Join'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMode(id);
                  setJoinStep('credentials');
                  setOtpCode('');
                  setError(null);
                  setOtpHint(null);
                  setOtpTicket(null);
                }}
                className={`app-mode-tab ${mode === id ? 'app-mode-tab-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={onAuth} autoComplete="on" className="space-y-4">
            {mode === 'join' && joinStep === 'otp' ? (
              <>
                <p className="font-app-sans text-sm text-ink/55">{email}</p>
                <label className="block space-y-1.5">
                  <span className="font-app-sans text-[11px] tracking-[0.16em] text-ink/50 uppercase">
                    Verification code
                  </span>
                  <input
                    required
                    inputMode="numeric"
                    pattern="[0-9]{4,6}"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="app-input tracking-[0.3em]"
                    placeholder="Code from email"
                    autoFocus
                  />
                </label>
              </>
            ) : (
              <>
                {mode === 'join' && (
                  <label className="block space-y-1.5">
                    <span className="font-app-sans text-[11px] tracking-[0.16em] text-ink/50 uppercase">
                      Name
                    </span>
                    <input
                      required
                      name="name"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="app-input"
                      placeholder="Your name"
                    />
                  </label>
                )}
                <label className="block space-y-1.5">
                  <span className="font-app-sans text-[11px] tracking-[0.16em] text-ink/50 uppercase">
                    Email
                  </span>
                  <input
                    type="email"
                    required
                    name="email"
                    autoComplete={mode === 'signIn' ? 'username' : 'email'}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="app-input"
                    placeholder="you@email.com"
                  />
                </label>
                <PasswordField
                  label="Password"
                  name="password"
                  autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={setPassword}
                  placeholder="6+ characters"
                />
                {mode === 'join' && (
                  <PasswordField
                    label="Confirm password"
                    name="confirm-password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Repeat password"
                  />
                )}
              </>
            )}
            {otpHint && <p className="font-app-sans text-sm text-atlantic">{otpHint}</p>}
            {error && <p className="font-app-sans text-sm text-rose-700">{error}</p>}
            <button type="submit" disabled={busy} className="app-btn app-btn-ink">
              {busy
                ? 'Please wait…'
                : mode === 'signIn'
                  ? 'Sign in'
                  : joinStep === 'credentials'
                    ? 'Continue to verification'
                    : 'Verify & create account'}
            </button>
            {mode === 'join' && joinStep === 'otp' && (
              <button
                type="button"
                className="w-full font-app-sans text-xs text-ink/45"
                onClick={() => {
                  setJoinStep('credentials');
                  setOtpCode('');
                  setOtpHint(null);
                  setOtpTicket(null);
                }}
              >
                Back to account details
              </button>
            )}
          </form>
        </div>
      </motion.div>
    );
  }

  const points = club?.points ?? user.points;
  const credit = club?.creditUsd ?? user.creditUsd;

  return (
    <motion.div
      key="member"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: clubEase }}
      className="min-h-full bg-paper text-ink"
    >
      {showFingerPrompt && fingerprintAvailable && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: clubEase }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 px-4 pb-8 sm:items-center sm:pb-0"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, ease: clubEase }}
            className="w-full max-w-md space-y-4 rounded-2xl border border-ink/10 bg-paper p-6 shadow-xl"
          >
            <Fingerprint className="h-8 w-8 text-atlantic" />
            <h2 className="font-app-display text-2xl">Add fingerprint?</h2>
            <p className="font-app-sans text-sm text-ink/60">
              Optional. Unlock Club next time with your fingerprint. You can change this in Settings.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="app-btn app-btn-ghost flex-1"
                onClick={() => {
                  skipFingerprintEnrollment();
                  setShowFingerPrompt(false);
                }}
              >
                Not now
              </button>
              <button
                type="button"
                className="app-btn app-btn-ink flex-1"
                onClick={async () => {
                  try {
                    await enrollFingerprint();
                    setShowFingerPrompt(false);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Could not enroll');
                    skipFingerprintEnrollment();
                    setShowFingerPrompt(false);
                  }
                }}
              >
                Add fingerprint
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      <header
        className="sticky top-0 z-20 border-b border-ink/8 bg-paper/95 px-5 py-4 backdrop-blur-md"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <p className="font-app-sans text-[11px] font-medium tracking-[0.22em] text-atlantic uppercase">
          Meridian Club
        </p>
        <h1 className="font-app-display text-2xl tracking-tight">Atelier credit &amp; perks</h1>
      </header>

      <div className="space-y-6 px-5 py-6 pb-12">
        <div className="rounded-xl border border-ink/10 bg-linear-to-br from-atlantic/12 to-transparent px-5 py-5">
          <div className="flex items-center gap-2 text-atlantic">
            <Sparkles className="h-4 w-4" />
            <span className="font-app-sans text-[11px] tracking-[0.18em] uppercase">Balance</span>
          </div>
          <p className="mt-2 font-app-display text-4xl tracking-tight">{points.toLocaleString()} pts</p>
          <p className="mt-1 font-app-sans text-sm text-ink/55">
            ≈ ${credit} planning credit · 100 pts = $1
          </p>
        </div>

        <div className="flex gap-0 overflow-x-auto border-b border-ink/8">
          {(
            [
              ['overview', 'Activity'],
              ['status', 'Consult'],
              ['guests', 'Guests'],
              ['wishlist', 'Wishlist'],
              ['vault', 'Vault'],
              ['settings', 'Settings'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPane(id)}
              className={`app-mode-tab shrink-0 flex-none! px-3 ${pane === id ? 'app-mode-tab-active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pane}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: clubEase }}
          >
        {pane === 'settings' && (
          <div className="space-y-4">
            <p className="font-app-sans text-[11px] tracking-[0.16em] text-ink/45 uppercase">
              Account
            </p>
            <div className="space-y-4 rounded-xl border border-ink/10 px-4 py-4">
              <label className="block space-y-1.5">
                <span className="font-app-sans text-[11px] tracking-[0.16em] text-ink/50 uppercase">
                  Name
                </span>
                <input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="app-input"
                  placeholder="Your name"
                  maxLength={80}
                  autoComplete="name"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="font-app-sans text-[11px] tracking-[0.16em] text-ink/50 uppercase">
                  Email
                </span>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="app-input opacity-70"
                  autoComplete="email"
                />
                <span className="block font-app-sans text-[11px] text-ink/40">
                  Email can’t be changed here.
                </span>
              </label>
              <button
                type="button"
                disabled={
                  profileSaving ||
                  !profileName.trim() ||
                  profileName.trim() === user.name
                }
                onClick={async () => {
                  setProfileSaving(true);
                  setError(null);
                  setSettingsNote(null);
                  try {
                    await updateAccountProfile(profileName.trim());
                    setSettingsNote('Profile saved.');
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Could not save profile');
                  } finally {
                    setProfileSaving(false);
                  }
                }}
                className="app-btn app-btn-ink"
              >
                {profileSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>

            <p className="font-app-sans text-[11px] tracking-[0.16em] text-ink/45 uppercase">
              Security
            </p>
            <div className="flex items-start justify-between gap-4 rounded-xl border border-ink/10 px-4 py-4">
              <div>
                <p className="font-app-display text-xl">Fingerprint</p>
                <p className="mt-1 font-app-sans text-xs text-ink/55">
                  {fingerprintAvailable
                    ? 'Unlock Club with your device fingerprint / platform biometrics.'
                    : 'Fingerprint unlock isn’t available in this browser.'}
                </p>
              </div>
              <button
                type="button"
                disabled={!fingerprintAvailable && !fingerprintEnabled}
                onClick={async () => {
                  setSettingsNote(null);
                  setError(null);
                  try {
                    if (fingerprintEnabled) {
                      disableFingerprintFromSettings();
                      setSettingsNote('Fingerprint is off.');
                    } else {
                      await enableFingerprintFromSettings();
                      setSettingsNote('Fingerprint is on.');
                    }
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Could not update');
                  }
                }}
                className={`shrink-0 rounded-lg border px-3 py-2 font-app-sans text-xs ${
                  fingerprintEnabled
                    ? 'border-atlantic text-atlantic'
                    : 'border-ink/15 text-ink/50'
                }`}
              >
                {fingerprintEnabled ? 'On' : 'Off'}
              </button>
            </div>
            {settingsNote && <p className="font-app-sans text-sm text-atlantic">{settingsNote}</p>}
            {error && <p className="font-app-sans text-sm text-rose-700">{error}</p>}

            <div className="border-t border-ink/8 pt-4">
              <button
                type="button"
                onClick={signOut}
                className="app-btn app-btn-ghost inline-flex w-full items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}

        {pane === 'overview' && (
          <ul className="space-y-3">
            {(club?.history ?? []).length === 0 && (
              <li className="rounded-xl border border-dashed border-ink/12 px-5 py-8 text-center">
                <p className="font-app-display text-xl text-ink">Your activity starts here</p>
                <p className="mt-2 font-app-sans text-sm text-ink/50">
                  Save a plan or send an inquiry to begin earning atelier points.
                </p>
              </li>
            )}
            {(club?.history ?? []).map((entry, i) => (
              <motion.li
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: Math.min(i, 5) * 0.05, ease: clubEase }}
                className="flex items-start justify-between gap-3 border-b border-ink/5 pb-3"
              >
                <div>
                  <p className="font-app-sans text-sm text-ink">{entry.reason}</p>
                  <p className="font-app-sans text-[11px] text-ink/40">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`font-app-sans text-sm tabular-nums ${
                    entry.delta >= 0 ? 'text-atlantic' : 'text-ink/55'
                  }`}
                >
                  {entry.delta >= 0 ? '+' : ''}
                  {entry.delta}
                </span>
              </motion.li>
            ))}
          </ul>
        )}

        {pane === 'wishlist' && (
          <div className="space-y-4">
            <form onSubmit={addWish} className="space-y-3">
              <input
                value={wishLabel}
                onChange={(e) => setWishLabel(e.target.value)}
                className="app-input"
                placeholder="Venue, city, or mood…"
              />
              <div className="flex gap-2">
                {(['overseas', 'local'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setWishType(t)}
                    className={`flex-1 rounded-lg border px-3 py-2 font-app-sans text-xs capitalize ${
                      wishType === t ? 'border-atlantic text-atlantic' : 'border-ink/15 text-ink/50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                className="app-btn app-btn-ink"
              >
                <Heart className="h-4 w-4" />
                Save to wishlist
              </button>
            </form>
            <ul className="space-y-3">
              {wishlist.length === 0 && (
                <li className="rounded-xl border border-dashed border-ink/12 px-5 py-8 text-center">
                  <p className="font-app-display text-xl text-ink">No wishes yet</p>
                  <p className="mt-2 font-app-sans text-sm text-ink/50">
                    Capture a venue, city, or mood above — we’ll keep it with your Club.
                  </p>
                </li>
              )}
              {wishlist.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-ink/10 px-4 py-3">
                  <div>
                    <p className="font-app-display text-lg text-ink">{item.label}</p>
                    <p className="font-app-sans text-[11px] tracking-wide text-ink/45 uppercase">
                      {item.locationType}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await removeWishlistItem(item.id);
                      setWishlist((prev) => prev.filter((w) => w.id !== item.id));
                    }}
                    className="font-app-sans text-xs text-ink/40"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {pane === 'status' && (
          <ul className="space-y-4">
            {inquiries.length === 0 && (
              <li className="rounded-xl border border-dashed border-ink/12 px-5 py-8 text-center list-none">
                <p className="font-app-display text-xl text-ink">No consults yet</p>
                <p className="mt-2 font-app-sans text-sm text-ink/50">
                  Inquire from a blueprint to track planner status here in real time.
                </p>
              </li>
            )}
            {inquiries.map((inq) => (
              <li key={inq.id} className="space-y-3 rounded-xl border border-ink/10 px-4 py-4">
                <div>
                  <p className="font-app-display text-xl text-ink">
                    {inq.planTitle || 'Planner consult'}
                  </p>
                  <p className="font-app-sans text-xs text-ink/50">
                    {CONSULT_STATUS_LABELS[inq.status]}
                    {inq.creditAppliedUsd > 0 ? ` · $${inq.creditAppliedUsd} credit applied` : ''}
                  </p>
                </div>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
                  <p className="font-app-sans text-xs text-ink/50">
                    Your planner updates status here. You&apos;ll see changes in real time after
                    your strategy call and deposit.
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {pane === 'guests' && (
          <div className="space-y-6">
            <CommunicationSuite
              unlocked={inquiries.some(
                (inq) => inq.status === 'deposit' || inq.status === 'completed',
              )}
            />

            <div className="space-y-3 border-t border-ink/8 pt-4">
              <p className="font-app-sans text-[11px] tracking-[0.16em] text-ink/45 uppercase">
                Live guest lists
              </p>
              {inquiries.filter((inq) => inq.status === 'deposit' || inq.status === 'completed')
                .length === 0 && (
                <p className="rounded-xl border border-dashed border-ink/12 px-5 py-6 text-center font-app-sans text-sm text-ink/50">
                  Advance a consult to Deposit under Consult to unlock guest invites.
                </p>
              )}
              {inquiries
                .filter((inq) => inq.status === 'deposit' || inq.status === 'completed')
                .map((inq) => (
                  <div key={inq.id} className="space-y-2 rounded-xl border border-ink/10 px-4 py-4">
                    <p className="font-app-display text-lg text-ink">
                      {inq.planTitle || 'Planner consult'}
                    </p>
                    <ClubGuestPanel inquiry={inq} />
                  </div>
                ))}
            </div>
          </div>
        )}

        {pane === 'vault' && (
          <ul className="space-y-3">
            {vault.length === 0 && (
              <li className="rounded-xl border border-dashed border-ink/12 px-5 py-8 text-center">
                <p className="font-app-display text-xl text-ink">Vault is empty</p>
                <p className="mt-2 font-app-sans text-sm text-ink/50">
                  Synced proposals appear here when you save a plan to your Club account.
                </p>
              </li>
            )}
            {vault.map((doc, i) => (
              <motion.li
                key={doc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: Math.min(i, 5) * 0.05, ease: clubEase }}
                className="rounded-xl border border-ink/10 px-4 py-3"
              >
                <p className="font-app-sans text-[10px] tracking-[0.16em] text-atlantic uppercase">
                  {doc.kind}
                </p>
                <p className="font-app-display text-xl text-ink">{doc.title}</p>
                <p className="font-app-sans text-xs text-ink/50">{doc.summary}</p>
              </motion.li>
            ))}
          </ul>
        )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function PasswordField({
  label,
  name,
  autoComplete,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  autoComplete: 'current-password' | 'new-password';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block space-y-1.5">
      <span className="font-app-sans text-[11px] tracking-[0.16em] text-ink/50 uppercase">
        {label}
      </span>
      <span className="relative block">
        <input
          type={visible ? 'text' : 'password'}
          name={name}
          autoComplete={autoComplete}
          required
          minLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="app-input w-full pr-12"
          placeholder={placeholder}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1.5 text-ink/40 transition-colors hover:text-ink/70"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}
